var GovCopilotScoringEngine = Class.create();
GovCopilotScoringEngine.prototype = {
    initialize: function() {},

    /**
     * Calculate domain score for one domain in a scan.
     * Reads findings, deducts per severity, floors at 0.
     * Writes a x_gov_copilot_domain_score record.
     * Returns the score (Integer).
     */
    calculateDomainScore: function(domain, scanRunSysId) {
        var batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));

        // Count findings by severity for this domain
        var counts = { critical: 0, high: 0, medium: 0, low: 0 };
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.addQuery('x_gov_copilot_scan_run', scanRunSysId);
        gr.addQuery('x_gov_copilot_domain', domain);
        gr.setLimit(batchSize);
        gr.query();
        var totalFindings = 0;
        while (gr.next()) {
            var sev = gr.getValue('x_gov_copilot_severity');
            if (counts.hasOwnProperty(sev)) {
                counts[sev]++;
            }
            totalFindings++;
        }

        // Deduct points using system properties
        var deductCritical = parseInt(gs.getProperty('x_gov_copilot.scoring.deduction.critical', '15'));
        var deductHigh = parseInt(gs.getProperty('x_gov_copilot.scoring.deduction.high', '8'));
        var deductMedium = parseInt(gs.getProperty('x_gov_copilot.scoring.deduction.medium', '4'));
        var deductLow = parseInt(gs.getProperty('x_gov_copilot.scoring.deduction.low', '1'));

        var score = 100
            - (counts.critical * deductCritical)
            - (counts.high * deductHigh)
            - (counts.medium * deductMedium)
            - (counts.low * deductLow);

        if (score < 0) score = 0;

        // Get previous score for delta calculation
        var previousScore = this.getPreviousScore(domain, scanRunSysId);
        var scoreDelta = (previousScore !== null) ? (score - previousScore) : 0;

        // Write domain score record
        var ds = new GlideRecord('x_gov_copilot_domain_score');
        ds.initialize();
        ds.setValue('x_gov_copilot_scan_run', scanRunSysId);
        ds.setValue('x_gov_copilot_domain', domain);
        ds.setValue('x_gov_copilot_score', score);
        ds.setValue('x_gov_copilot_previous_score', previousScore !== null ? previousScore : score);
        ds.setValue('x_gov_copilot_score_delta', scoreDelta);
        ds.setValue('x_gov_copilot_finding_count', totalFindings);
        ds.insert();

        return score;
    },

    /**
     * Get the score from the immediately prior completed scan for this domain.
     * Returns null if no previous scan exists.
     */
    getPreviousScore: function(domain, currentScanRunSysId) {
        // Find the started_at of current scan
        var currentScan = new GlideRecord('x_gov_copilot_scan_run');
        if (!currentScan.get(currentScanRunSysId)) return null;
        var currentStartedAt = currentScan.getValue('x_gov_copilot_started_at');

        // Find the most recent prior completed scan
        var prevScan = new GlideRecord('x_gov_copilot_scan_run');
        prevScan.addQuery('x_gov_copilot_status', 'IN', 'completed,partial');
        prevScan.addQuery('x_gov_copilot_started_at', '<', currentStartedAt);
        prevScan.addQuery('sys_id', '!=', currentScanRunSysId);
        prevScan.orderByDesc('x_gov_copilot_started_at');
        prevScan.setLimit(1);
        prevScan.query();
        if (!prevScan.next()) return null;
        var prevScanId = prevScan.getUniqueValue();

        // Find the domain score for that scan
        var ds = new GlideRecord('x_gov_copilot_domain_score');
        ds.addQuery('x_gov_copilot_scan_run', prevScanId);
        ds.addQuery('x_gov_copilot_domain', domain);
        ds.setLimit(1);
        ds.query();
        if (!ds.next()) return null;
        return parseInt(ds.getValue('x_gov_copilot_score'));
    },

    /**
     * Calculate the weighted overall health score for a completed scan.
     * Reads domain scores and weights from sys_properties.
     * Writes overall_health_score to the scan_run record.
     * If scan is partial (any modules_failed > 0), sets overall_health_score to null.
     * Returns the score, or null if partial.
     */
    calculateOverallHealthScore: function(scanRunSysId) {
        // Check if scan is partial
        var scanRun = new GlideRecord('x_gov_copilot_scan_run');
        if (!scanRun.get(scanRunSysId)) return null;

        if (parseInt(scanRun.getValue('x_gov_copilot_modules_failed')) > 0) {
            // Partial scan — suppress overall score
            scanRun.setValue('x_gov_copilot_overall_health_score', null);
            scanRun.update();
            return null;
        }

        // Read domain weights
        var weights = {
            security: parseInt(gs.getProperty('x_gov_copilot.scoring.weight.security', '25')),
            performance: parseInt(gs.getProperty('x_gov_copilot.scoring.weight.performance', '25')),
            cmdb: parseInt(gs.getProperty('x_gov_copilot.scoring.weight.cmdb', '20')),
            integration: parseInt(gs.getProperty('x_gov_copilot.scoring.weight.integration', '15')),
            catalog: parseInt(gs.getProperty('x_gov_copilot.scoring.weight.catalog', '15'))
        };

        // Read domain scores and calculate weighted sum
        var overallScore = 0;
        var domains = ['security', 'performance', 'cmdb', 'integration', 'catalog'];
        for (var i = 0; i < domains.length; i++) {
            var domain = domains[i];
            var ds = new GlideRecord('x_gov_copilot_domain_score');
            ds.addQuery('x_gov_copilot_scan_run', scanRunSysId);
            ds.addQuery('x_gov_copilot_domain', domain);
            ds.setLimit(1);
            ds.query();
            var domainScore = ds.next() ? parseInt(ds.getValue('x_gov_copilot_score')) : 0;
            overallScore += (domainScore * weights[domain]) / 100;
        }

        var finalScore = Math.round(overallScore);
        scanRun.setValue('x_gov_copilot_overall_health_score', finalScore);
        scanRun.update();
        return finalScore;
    },

    /**
     * Map a score to a health status string.
     * Uses threshold system properties.
     */
    getHealthStatus: function(score) {
        if (score === null || score === undefined) return 'Unknown';
        var healthy = parseInt(gs.getProperty('x_gov_copilot.scoring.threshold.healthy', '80'));
        var attention = parseInt(gs.getProperty('x_gov_copilot.scoring.threshold.attention', '60'));
        var risk = parseInt(gs.getProperty('x_gov_copilot.scoring.threshold.risk', '40'));

        if (score >= healthy) return 'Healthy';
        if (score >= attention) return 'Needs Attention';
        if (score >= risk) return 'At Risk';
        return 'Critical';
    },

    /**
     * Aggregate finding counts by severity across all findings for a scan.
     * Writes critical_count, high_count, medium_count, low_count, total_findings to scan_run.
     */
    updateScanRunCounts: function(scanRunSysId) {
        var batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));
        var counts = { critical: 0, high: 0, medium: 0, low: 0 };

        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.addQuery('x_gov_copilot_scan_run', scanRunSysId);
        gr.setLimit(batchSize * 10); // allow up to 10 batches worth
        gr.query();
        while (gr.next()) {
            var sev = gr.getValue('x_gov_copilot_severity');
            if (counts.hasOwnProperty(sev)) counts[sev]++;
        }

        var total = counts.critical + counts.high + counts.medium + counts.low;
        var scanRun = new GlideRecord('x_gov_copilot_scan_run');
        if (scanRun.get(scanRunSysId)) {
            scanRun.setValue('x_gov_copilot_critical_count', counts.critical);
            scanRun.setValue('x_gov_copilot_high_count', counts.high);
            scanRun.setValue('x_gov_copilot_medium_count', counts.medium);
            scanRun.setValue('x_gov_copilot_low_count', counts.low);
            scanRun.setValue('x_gov_copilot_total_findings', total);
            scanRun.update();
        }
        return total;
    },

    type: 'GovCopilotScoringEngine'
};
