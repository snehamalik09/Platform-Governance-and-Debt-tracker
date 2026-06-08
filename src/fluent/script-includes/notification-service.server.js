// GovCopilotNotificationService — Script Include
// Sends post-scan email notifications with a full HTML health summary.
// Recipients are read from sys_property x_gov_copilot.notification.recipients
// (comma-separated). If empty, sending is skipped with a warning.
// Uses GlideEmailOutbound — no external dependencies beyond core ServiceNow APIs.

var GovCopilotNotificationService = Class.create();
GovCopilotNotificationService.prototype = {
    initialize: function() {},

    // ---------------------------------------------------------------------------
    // PUBLIC: sendPostScanEmail
    // Entry point. Assembles all data for the given scan run, builds the HTML
    // body, and sends via GlideEmailOutbound.
    // Skips silently (with gs.warn) if no recipients are configured.
    // ---------------------------------------------------------------------------
    sendPostScanEmail: function(scanRunSysId) {
        if (!scanRunSysId) {
            gs.error('GovCopilotNotificationService: scanRunSysId is required');
            return;
        }

        var recipients = gs.getProperty('x_gov_copilot.notification.recipients', '');

        // Guard: skip if no recipients configured
        if (!recipients || recipients.trim() === '') {
            gs.warn('GovCopilotNotificationService: no recipients configured — skipping email');
            return;
        }

        // Load scan run record
        var scanRun = new GlideRecord('x_gov_copilot_scan_run');
        if (!scanRun.get(scanRunSysId)) {
            gs.error('GovCopilotNotificationService: scan run not found: ' + scanRunSysId);
            return;
        }

        var scanName      = scanRun.getValue('x_gov_copilot_name') || scanRunSysId;
        var status        = scanRun.getValue('x_gov_copilot_status') || '';
        var score         = scanRun.getValue('x_gov_copilot_overall_health_score');
        var criticalCount = parseInt(scanRun.getValue('x_gov_copilot_critical_count') || '0', 10);
        var highCount     = parseInt(scanRun.getValue('x_gov_copilot_high_count')    || '0', 10);
        var mediumCount   = parseInt(scanRun.getValue('x_gov_copilot_medium_count')  || '0', 10);
        var lowCount      = parseInt(scanRun.getValue('x_gov_copilot_low_count')     || '0', 10);
        var modulesFailed = parseInt(scanRun.getValue('x_gov_copilot_modules_failed') || '0', 10);

        // Determine health status label and badge colour
        var statusInfo = this._getStatusInfo(score);

        // Calculate score delta vs previous scan
        var scoreDelta    = this._getScoreDelta(scanRunSysId, score);

        // Gather top 5 risks and top 3 actions
        var top5Risks     = this._getTop5Risks(scanRunSysId);
        var top3Actions   = this._getTop3Actions(scanRunSysId);

        // Assemble data object for the HTML builder
        var data = {
            scanName:     scanName,
            status:       status,
            score:        score,
            statusLabel:  statusInfo.label,
            statusColour: statusInfo.colour,
            scoreDelta:   scoreDelta,
            criticalCount: criticalCount,
            highCount:    highCount,
            mediumCount:  mediumCount,
            lowCount:     lowCount,
            modulesFailed: modulesFailed,
            top5Risks:    top5Risks,
            top3Actions:  top3Actions
        };

        var htmlBody = this._buildHtmlBody(data);

        // Build subject line
        var subject = 'Platform Health Scan Complete - Score: ' + (score !== null && score !== '' ? score : 'N/A') + ' - ' + statusInfo.label;

        // Send email
        var email = new GlideEmailOutbound();
        email.setTo(recipients.trim());
        email.setSubject(subject);
        email.setBody(htmlBody);
        try {
            email.send();
            gs.info('GovCopilotNotificationService: email sent to ' + recipients);
        } catch (e) {
            gs.error('GovCopilotNotificationService: failed to send email — ' + e.message);
        }
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _getStatusInfo
    // Returns { label, colour } for the health score badge.
    // score null/empty → "Partial Scan" grey.
    // ---------------------------------------------------------------------------
    _getStatusInfo: function(score) {
        var scoreNum = (score !== null && score !== '') ? parseInt(score, 10) : null;

        if (scoreNum === null || isNaN(scoreNum)) {
            return { label: 'Partial Scan', colour: '#6c757d' };
        }
        if (scoreNum >= 80) {
            return { label: 'Healthy',       colour: '#28a745' };
        }
        if (scoreNum >= 60) {
            return { label: 'Needs Attention', colour: '#ffc107' };
        }
        if (scoreNum >= 40) {
            return { label: 'At Risk',       colour: '#fd7e14' };
        }
        return { label: 'Critical',          colour: '#dc3545' };
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _getScoreDelta
    // Compares current scan's overall_health_score with the previous scan's score.
    // Returns an object: { value: N, direction: 'up'|'down'|'same'|'unknown' }
    // ---------------------------------------------------------------------------
    _getScoreDelta: function(scanRunSysId, currentScore) {
        if (currentScore === null || currentScore === '') {
            return { value: null, direction: 'unknown' };
        }

        var currentNum = parseInt(currentScore, 10);

        // Find the most recent completed scan before this one
        var prevGr = new GlideRecord('x_gov_copilot_scan_run');
        prevGr.addQuery('sys_id', '!=', scanRunSysId);
        prevGr.addQuery('x_gov_copilot_status', 'completed');
        prevGr.addNotNullQuery('x_gov_copilot_overall_health_score');
        prevGr.orderByDesc('x_gov_copilot_started_at');
        prevGr.setLimit(1);
        prevGr.query();

        if (!prevGr.next()) {
            return { value: null, direction: 'unknown' };
        }

        var prevScore = parseInt(prevGr.getValue('x_gov_copilot_overall_health_score'), 10);
        var diff = currentNum - prevScore;

        if (diff > 0) {
            return { value: diff, direction: 'up' };
        }
        if (diff < 0) {
            return { value: Math.abs(diff), direction: 'down' };
        }
        return { value: 0, direction: 'same' };
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _getTop5Risks
    // Queries findings ordered by severity (critical first), limited to 5 total.
    // Runs 4 separate queries because ServiceNow cannot ORDER BY enum value.
    // ---------------------------------------------------------------------------
    _getTop5Risks: function(scanRunSysId) {
        var risks = [];
        var severities = ['critical', 'high', 'medium', 'low'];

        for (var i = 0; i < severities.length && risks.length < 5; i++) {
            var gr = new GlideRecord('x_gov_copilot_finding');
            gr.addQuery('x_gov_copilot_scan_run', scanRunSysId);
            gr.addQuery('x_gov_copilot_severity', severities[i]);
            gr.setLimit(5 - risks.length);
            gr.query();
            while (gr.next() && risks.length < 5) {
                risks.push({
                    title:    gr.getValue('x_gov_copilot_title')    || '',
                    severity: gr.getValue('x_gov_copilot_severity') || '',
                    domain:   gr.getValue('x_gov_copilot_domain')   || ''
                });
            }
        }

        return risks;
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _getTop3Actions
    // Queries top 3 findings (critical/high severity) that have a generated
    // recommendation; returns the first line of remediation_steps for each.
    // ---------------------------------------------------------------------------
    _getTop3Actions: function(scanRunSysId) {
        var actions = [];
        var severities = ['critical', 'high'];

        for (var i = 0; i < severities.length && actions.length < 3; i++) {
            var gr = new GlideRecord('x_gov_copilot_finding');
            gr.addQuery('x_gov_copilot_scan_run', scanRunSysId);
            gr.addQuery('x_gov_copilot_severity', severities[i]);
            gr.addNotNullQuery('x_gov_copilot_ai_recommendation');
            gr.setLimit(10);
            gr.query();

            while (gr.next() && actions.length < 3) {
                var recSysId = gr.getValue('x_gov_copilot_ai_recommendation');
                var rec = new GlideRecord('x_gov_copilot_recommendation');
                if (rec.get(recSysId) && rec.getValue('x_gov_copilot_ai_status') === 'generated') {
                    var steps = rec.getValue('x_gov_copilot_remediation_steps') || '';
                    var firstLine = steps.split('\n')[0] || steps;
                    actions.push({
                        finding: gr.getValue('x_gov_copilot_title') || '',
                        action:  firstLine
                    });
                    if (actions.length >= 3) { break; }
                }
            }
        }

        return actions;
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _buildHtmlBody
    // Constructs the full HTML email body using inline CSS (table-based layout
    // for broad email client compatibility).
    //
    // data shape:
    //   { scanName, status, score, statusLabel, statusColour, scoreDelta,
    //     criticalCount, highCount, mediumCount, lowCount, modulesFailed,
    //     top5Risks, top3Actions }
    // ---------------------------------------------------------------------------
    _buildHtmlBody: function(data) {
        var scoreDisplay = (data.score !== null && data.score !== '') ? data.score : 'N/A';

        // Build score delta string
        var deltaStr = '';
        if (data.scoreDelta && data.scoreDelta.direction === 'up') {
            deltaStr = '<span style="color:#28a745;">&#8593; ' + data.scoreDelta.value + ' pts vs previous</span>';
        } else if (data.scoreDelta && data.scoreDelta.direction === 'down') {
            deltaStr = '<span style="color:#dc3545;">&#8595; ' + data.scoreDelta.value + ' pts vs previous</span>';
        } else if (data.scoreDelta && data.scoreDelta.direction === 'same') {
            deltaStr = '<span style="color:#6c757d;">&#8212; No change vs previous</span>';
        } else {
            deltaStr = '<span style="color:#6c757d;">No previous scan to compare</span>';
        }

        // Build partial scan warning banner (only if status=partial and modulesFailed > 0)
        var partialBanner = '';
        if (data.status === 'partial' && data.modulesFailed > 0) {
            partialBanner = '<tr>'
                + '<td style="background-color:#fff3cd;border:1px solid #ffc107;padding:12px 16px;border-radius:4px;">'
                + '<strong style="color:#856404;">&#9888; Partial Scan &mdash; ' + data.modulesFailed + ' module(s) failed to complete.</strong>'
                + ' Some findings and scores may be incomplete.'
                + '</td>'
                + '</tr>'
                + '<tr><td style="height:12px;"></td></tr>';
        }

        // Build top 5 risks table rows
        var riskRows = '';
        if (data.top5Risks && data.top5Risks.length > 0) {
            for (var r = 0; r < data.top5Risks.length; r++) {
                var risk = data.top5Risks[r];
                var sevColour = this._severityColour(risk.severity);
                riskRows += '<tr style="background-color:' + (r % 2 === 0 ? '#ffffff' : '#f8f9fa') + ';">'
                    + '<td style="padding:8px 12px;border-bottom:1px solid #dee2e6;">' + this._escapeHtml(risk.title) + '</td>'
                    + '<td style="padding:8px 12px;border-bottom:1px solid #dee2e6;text-align:center;">'
                    + '<span style="background-color:' + sevColour + ';color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold;">'
                    + this._escapeHtml(risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1))
                    + '</span></td>'
                    + '<td style="padding:8px 12px;border-bottom:1px solid #dee2e6;text-transform:capitalize;">' + this._escapeHtml(risk.domain) + '</td>'
                    + '</tr>';
            }
        } else {
            riskRows = '<tr><td colspan="3" style="padding:8px 12px;color:#6c757d;font-style:italic;">No findings recorded for this scan.</td></tr>';
        }

        // Build top 3 actions list
        var actionItems = '';
        if (data.top3Actions && data.top3Actions.length > 0) {
            for (var a = 0; a < data.top3Actions.length; a++) {
                var action = data.top3Actions[a];
                actionItems += '<li style="margin-bottom:8px;">'
                    + '<strong>' + this._escapeHtml(action.finding) + ':</strong> '
                    + this._escapeHtml(action.action)
                    + '</li>';
            }
        } else {
            actionItems = '<li style="color:#6c757d;font-style:italic;">No AI-generated actions available for this scan.</li>';
        }

        // Assemble full HTML
        var html = '<!DOCTYPE html>'
            + '<html lang="en">'
            + '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
            + '<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;">'
            + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:24px 0;">'
            + '<tr><td align="center">'
            + '<table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);">'

            // ---- Header ----
            + '<tr>'
            + '<td style="background-color:#0e4d92;padding:20px 24px;">'
            + '<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;">Platform Health Scan Complete</h1>'
            + '<p style="margin:4px 0 0;color:#c8d9ec;font-size:13px;">Scan: ' + this._escapeHtml(data.scanName) + '</p>'
            + '</td>'
            + '</tr>'

            // ---- Body wrapper ----
            + '<tr><td style="padding:24px;">'
            + '<table width="100%" cellpadding="0" cellspacing="0">'

            // ---- Partial scan warning (inserted before score section if applicable) ----
            + partialBanner

            // ---- Health score section ----
            + '<tr>'
            + '<td style="padding-bottom:20px;">'
            + '<table cellpadding="0" cellspacing="0">'
            + '<tr>'
            + '<td style="vertical-align:middle;padding-right:16px;">'
            + '<div style="background-color:' + data.statusColour + ';color:#ffffff;border-radius:50%;width:72px;height:72px;text-align:center;line-height:72px;font-size:22px;font-weight:bold;">'
            + scoreDisplay
            + '</div>'
            + '</td>'
            + '<td style="vertical-align:middle;">'
            + '<div style="font-size:18px;font-weight:bold;color:' + data.statusColour + ';">' + this._escapeHtml(data.statusLabel) + '</div>'
            + '<div style="font-size:13px;margin-top:4px;">' + deltaStr + '</div>'
            + '</td>'
            + '</tr>'
            + '</table>'
            + '</td>'
            + '</tr>'

            // ---- Severity summary ----
            + '<tr>'
            + '<td style="padding-bottom:20px;">'
            + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:4px;">'
            + '<tr>'
            + '<td style="padding:12px 16px;font-weight:bold;font-size:13px;color:#555;">Severity Summary</td>'
            + '</tr>'
            + '<tr>'
            + '<td style="padding:0 16px 12px;">'
            + '<span style="display:inline-block;margin-right:16px;"><span style="color:#dc3545;font-weight:bold;">Critical:</span> ' + data.criticalCount + '</span>'
            + '<span style="display:inline-block;margin-right:16px;"><span style="color:#fd7e14;font-weight:bold;">High:</span> '     + data.highCount     + '</span>'
            + '<span style="display:inline-block;margin-right:16px;"><span style="color:#ffc107;font-weight:bold;">Medium:</span> '   + data.mediumCount   + '</span>'
            + '<span style="display:inline-block;"><span style="color:#28a745;font-weight:bold;">Low:</span> '                       + data.lowCount      + '</span>'
            + '</td>'
            + '</tr>'
            + '</table>'
            + '</td>'
            + '</tr>'

            // ---- Top 5 Risks table ----
            + '<tr>'
            + '<td style="padding-bottom:20px;">'
            + '<h2 style="font-size:15px;margin:0 0 10px;color:#333;">Top 5 Risks</h2>'
            + '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dee2e6;border-radius:4px;border-collapse:collapse;">'
            + '<thead>'
            + '<tr style="background-color:#e9ecef;">'
            + '<th style="padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #dee2e6;">Title</th>'
            + '<th style="padding:8px 12px;text-align:center;font-size:13px;border-bottom:1px solid #dee2e6;">Severity</th>'
            + '<th style="padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #dee2e6;">Domain</th>'
            + '</tr>'
            + '</thead>'
            + '<tbody>'
            + riskRows
            + '</tbody>'
            + '</table>'
            + '</td>'
            + '</tr>'

            // ---- Top 3 Recommended Actions ----
            + '<tr>'
            + '<td style="padding-bottom:20px;">'
            + '<h2 style="font-size:15px;margin:0 0 10px;color:#333;">Top 3 Recommended Actions</h2>'
            + '<ol style="margin:0;padding-left:20px;">'
            + actionItems
            + '</ol>'
            + '</td>'
            + '</tr>'

            // ---- Links section ----
            + '<tr>'
            + '<td style="padding-bottom:20px;">'
            + '<table cellpadding="0" cellspacing="0">'
            + '<tr>'
            + '<td style="padding-right:12px;">'
            + '<a href="/sp?id=gov_copilot_dashboard" style="background-color:#0e4d92;color:#ffffff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;display:inline-block;">View Dashboard</a>'
            + '</td>'
            + '<td>'
            + '<a href="/gov_copilot_admin_report.do" style="background-color:#6c757d;color:#ffffff;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;display:inline-block;">Admin Report</a>'
            + '</td>'
            + '</tr>'
            + '</table>'
            + '</td>'
            + '</tr>'

            // ---- End body table ----
            + '</table>'
            + '</td></tr>'

            // ---- Footer ----
            + '<tr>'
            + '<td style="background-color:#f8f9fa;padding:14px 24px;text-align:center;border-top:1px solid #dee2e6;">'
            + '<p style="margin:0;font-size:12px;color:#6c757d;">Generated by Platform Governance &amp; Health Copilot</p>'
            + '</td>'
            + '</tr>'

            + '</table>'
            + '</td></tr>'
            + '</table>'
            + '</body>'
            + '</html>';

        return html;
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _severityColour
    // Returns a hex colour for a severity badge inside the risks table.
    // ---------------------------------------------------------------------------
    _severityColour: function(severity) {
        if (severity === 'critical') { return '#dc3545'; }
        if (severity === 'high')     { return '#fd7e14'; }
        if (severity === 'medium')   { return '#ffc107'; }
        if (severity === 'low')      { return '#28a745'; }
        return '#6c757d';
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _escapeHtml
    // Minimal HTML escape to prevent XSS in dynamically inserted field values.
    // ---------------------------------------------------------------------------
    _escapeHtml: function(str) {
        if (!str) { return ''; }
        var s = '' + str;
        s = s.replace(/&/g,  '&amp;');
        s = s.replace(/</g,  '&lt;');
        s = s.replace(/>/g,  '&gt;');
        s = s.replace(/"/g,  '&quot;');
        s = s.replace(/'/g,  '&#39;');
        return s;
    },

    type: 'GovCopilotNotificationService'
};
