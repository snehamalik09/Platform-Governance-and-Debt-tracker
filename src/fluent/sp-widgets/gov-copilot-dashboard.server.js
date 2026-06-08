// Platform Governance & Health Copilot — Dashboard Widget Server Script
// Populates the data object consumed by the AngularJS controller.
// ES5/Rhino — var only, no arrow functions, no template literals.
// AC-F11 (health gauge), AC-F12 (domain scorecards), AC-F13 (findings),
// AC-F14 (trend charts), AC-F15 (cost optimisation).

(function() {
    data.latestScan = null;
    data.previousScan = null;
    data.domainScores = [];
    data.previousDomainScores = [];
    data.findings = [];
    data.trendData = [];
    data.costOpt = {
        unusedIntegrations: 0,
        zeroRequestCatalogItems: 0,
        flowsNeverTriggered: 0,
        jobsNeverRun: 0
    };
    data.isSysadmin = gs.hasRole('sysadmin');
    data.aiRecommendationCount = 0;

    // -----------------------------------------------------------------------
    // 1. Latest completed scan_run
    // -----------------------------------------------------------------------
    var scanGr = new GlideRecord('x_gov_copilot_scan_run');
    var statusQuery = scanGr.addQuery('x_gov_copilot_status', 'completed');
    statusQuery.addOrCondition('x_gov_copilot_status', 'partial');
    scanGr.orderByDesc('x_gov_copilot_started_at');
    scanGr.setLimit(2);
    scanGr.query();

    var latestSysId = null;
    var previousSysId = null;

    if (scanGr.next()) {
        latestSysId = scanGr.getUniqueValue();
        data.latestScan = {
            sys_id: latestSysId,
            name: scanGr.getValue('x_gov_copilot_name'),
            status: scanGr.getValue('x_gov_copilot_status'),
            overall_health_score: parseInt(scanGr.getValue('x_gov_copilot_overall_health_score') || '0', 10),
            started_at: scanGr.getDisplayValue('x_gov_copilot_started_at'),
            completed_at: scanGr.getDisplayValue('x_gov_copilot_completed_at'),
            duration_seconds: parseInt(scanGr.getValue('x_gov_copilot_duration_seconds') || '0', 10),
            critical_count: parseInt(scanGr.getValue('x_gov_copilot_critical_count') || '0', 10),
            high_count: parseInt(scanGr.getValue('x_gov_copilot_high_count') || '0', 10),
            medium_count: parseInt(scanGr.getValue('x_gov_copilot_medium_count') || '0', 10),
            low_count: parseInt(scanGr.getValue('x_gov_copilot_low_count') || '0', 10),
            modules_failed: scanGr.getValue('x_gov_copilot_modules_failed') || ''
        };
    }

    if (scanGr.next()) {
        previousSysId = scanGr.getUniqueValue();
        data.previousScan = {
            sys_id: previousSysId,
            overall_health_score: parseInt(scanGr.getValue('x_gov_copilot_overall_health_score') || '0', 10)
        };
    }

    if (!latestSysId) {
        return; // No scans yet — return early
    }

    // -----------------------------------------------------------------------
    // 2. Domain scores for latest scan (AC-F12)
    // -----------------------------------------------------------------------
    var dsGr = new GlideRecord('x_gov_copilot_domain_score');
    dsGr.addQuery('x_gov_copilot_scan_run', latestSysId);
    dsGr.query();
    while (dsGr.next()) {
        data.domainScores.push({
            sys_id: dsGr.getUniqueValue(),
            domain: dsGr.getValue('x_gov_copilot_domain'),
            score: parseInt(dsGr.getValue('x_gov_copilot_score') || '0', 10),
            previous_score: parseInt(dsGr.getValue('x_gov_copilot_previous_score') || '0', 10),
            score_delta: parseFloat(dsGr.getValue('x_gov_copilot_score_delta') || '0'),
            finding_count: parseInt(dsGr.getValue('x_gov_copilot_finding_count') || '0', 10)
        });
    }

    // Fill in stub entries for any domains missing from this scan
    var REQUIRED_DOMAINS = ['performance', 'security', 'integration', 'catalog', 'cmdb'];
    var foundDomains = {};
    for (var di = 0; di < data.domainScores.length; di++) {
        foundDomains[data.domainScores[di].domain] = true;
    }
    for (var ri = 0; ri < REQUIRED_DOMAINS.length; ri++) {
        if (!foundDomains[REQUIRED_DOMAINS[ri]]) {
            data.domainScores.push({
                domain: REQUIRED_DOMAINS[ri],
                score: null,
                previous_score: null,
                score_delta: 0,
                finding_count: 0,
                critical_count: 0,
                high_count: 0,
                medium_count: 0,
                low_count: 0,
                missing: true
            });
        }
    }

    // Sort domain scores into a consistent display order
    var DOMAIN_ORDER = { security: 0, performance: 1, cmdb: 2, integration: 3, catalog: 4 };
    data.domainScores.sort(function(a, b) {
        return (DOMAIN_ORDER[a.domain] || 99) - (DOMAIN_ORDER[b.domain] || 99);
    });

    // Domain severity breakdown from findings
    var domainSeverityMap = {};
    var severityKeys = ['critical', 'high', 'medium', 'low'];
    for (var i = 0; i < data.domainScores.length; i++) {
        var d = data.domainScores[i].domain;
        domainSeverityMap[d] = { critical: 0, high: 0, medium: 0, low: 0 };
    }

    var domainFindGr = new GlideRecord('x_gov_copilot_finding');
    domainFindGr.addQuery('x_gov_copilot_scan_run', latestSysId);
    domainFindGr.setLimit(2000);
    domainFindGr.query();
    while (domainFindGr.next()) {
        var dom = domainFindGr.getValue('x_gov_copilot_domain');
        var sev = domainFindGr.getValue('x_gov_copilot_severity');
        if (!domainSeverityMap[dom]) {
            domainSeverityMap[dom] = { critical: 0, high: 0, medium: 0, low: 0 };
        }
        if (sev && domainSeverityMap[dom][sev] !== undefined) {
            domainSeverityMap[dom][sev]++;
        }
    }

    for (var j = 0; j < data.domainScores.length; j++) {
        var domName = data.domainScores[j].domain;
        var counts = domainSeverityMap[domName] || { critical: 0, high: 0, medium: 0, low: 0 };
        data.domainScores[j].critical_count = counts.critical;
        data.domainScores[j].high_count = counts.high;
        data.domainScores[j].medium_count = counts.medium;
        data.domainScores[j].low_count = counts.low;
    }

    // -----------------------------------------------------------------------
    // 3. Findings for latest scan (AC-F13) — max 200
    // -----------------------------------------------------------------------
    var findGr = new GlideRecord('x_gov_copilot_finding');
    findGr.addQuery('x_gov_copilot_scan_run', latestSysId);
    findGr.setLimit(200);
    findGr.query();
    while (findGr.next()) {
        data.findings.push({
            sys_id: findGr.getUniqueValue(),
            title: findGr.getValue('x_gov_copilot_title'),
            description: findGr.getValue('x_gov_copilot_description'),
            domain: findGr.getValue('x_gov_copilot_domain'),
            finding_type: findGr.getValue('x_gov_copilot_finding_type'),
            severity: findGr.getValue('x_gov_copilot_severity'),
            affected_table: findGr.getValue('x_gov_copilot_affected_table'),
            affected_record_name: findGr.getValue('x_gov_copilot_affected_record_name'),
            remediation_status: findGr.getValue('x_gov_copilot_remediation_status'),
            ai_recommendation: findGr.getValue('x_gov_copilot_ai_recommendation')
        });
    }
    var SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
    data.findings.sort(function(a, b) {
        return (SEVERITY_ORDER[a.severity] !== undefined ? SEVERITY_ORDER[a.severity] : 99) -
               (SEVERITY_ORDER[b.severity] !== undefined ? SEVERITY_ORDER[b.severity] : 99);
    });

    // -----------------------------------------------------------------------
    // 4. AI recommendation count (findings with generated recommendations)
    // -----------------------------------------------------------------------
    var recAgg = new GlideAggregate('x_gov_copilot_recommendation');
    recAgg.addQuery('x_gov_copilot_finding.x_gov_copilot_scan_run', latestSysId);
    recAgg.addQuery('x_gov_copilot_ai_status', 'generated');
    recAgg.addAggregate('COUNT');
    recAgg.query();
    data.aiRecommendationCount = 0;
    if (recAgg.next()) {
        data.aiRecommendationCount = parseInt(recAgg.getAggregate('COUNT'), 10);
    }

    // -----------------------------------------------------------------------
    // 5. Trend data — last 10 completed scans (AC-F14)
    // -----------------------------------------------------------------------
    var trendGr = new GlideRecord('x_gov_copilot_scan_run');
    trendGr.addQuery('x_gov_copilot_status', 'completed');
    trendGr.orderByDesc('x_gov_copilot_started_at');
    trendGr.setLimit(10);
    trendGr.query();
    while (trendGr.next()) {
        data.trendData.push({
            sys_id: trendGr.getUniqueValue(),
            name: trendGr.getValue('x_gov_copilot_name'),
            started_at: trendGr.getDisplayValue('x_gov_copilot_started_at'),
            overall_health_score: parseInt(trendGr.getValue('x_gov_copilot_overall_health_score') || '0', 10),
            critical_count: parseInt(trendGr.getValue('x_gov_copilot_critical_count') || '0', 10),
            high_count: parseInt(trendGr.getValue('x_gov_copilot_high_count') || '0', 10),
            medium_count: parseInt(trendGr.getValue('x_gov_copilot_medium_count') || '0', 10),
            low_count: parseInt(trendGr.getValue('x_gov_copilot_low_count') || '0', 10)
        });
    }
    // Reverse so oldest is first (left side of chart)
    data.trendData.reverse();

    // -----------------------------------------------------------------------
    // 6. Cost Optimisation (AC-F15) — all queries capped at setLimit(100)
    // -----------------------------------------------------------------------
    var ninetyDaysAgo = new GlideDateTime();
    ninetyDaysAgo.addDaysUTC(-90);
    var ninetyDaysAgoValue = ninetyDaysAgo.getValue();

    // 6a. Unused REST integrations
    var usedRest = {};
    var logGr = new GlideRecord('sys_rest_message_fn_log');
    logGr.addQuery('sys_created_on', '>=', ninetyDaysAgoValue);
    logGr.setLimit(100);
    logGr.query();
    while (logGr.next()) {
        usedRest[logGr.getValue('rest_message')] = true;
    }
    var restGr = new GlideRecord('sys_rest_message');
    restGr.addQuery('active', true);
    restGr.setLimit(100);
    restGr.query();
    var unusedRestCount = 0;
    while (restGr.next()) {
        if (!usedRest[restGr.getUniqueValue()]) {
            unusedRestCount++;
        }
    }
    data.costOpt.unusedIntegrations = unusedRestCount;

    // 6b. Zero-request catalog items (active, no sc_req_item in last 90 days)
    var usedCatItems = {};
    var reqGr = new GlideRecord('sc_req_item');
    reqGr.addQuery('sys_created_on', '>=', ninetyDaysAgoValue);
    reqGr.setLimit(100);
    reqGr.query();
    while (reqGr.next()) {
        usedCatItems[reqGr.getValue('cat_item')] = true;
    }
    var catGr = new GlideRecord('sc_cat_item');
    catGr.addQuery('active', true);
    catGr.setLimit(100);
    catGr.query();
    var unusedCatCount = 0;
    while (catGr.next()) {
        if (!usedCatItems[catGr.getUniqueValue()]) {
            unusedCatCount++;
        }
    }
    data.costOpt.zeroRequestCatalogItems = unusedCatCount;

    // 6c. Flows never triggered (no sys_flow_context in last 90 days)
    var triggeredFlows = {};
    var flowCtxGr = new GlideRecord('sys_flow_context');
    flowCtxGr.addQuery('sys_created_on', '>=', ninetyDaysAgoValue);
    flowCtxGr.setLimit(100);
    flowCtxGr.query();
    while (flowCtxGr.next()) {
        triggeredFlows[flowCtxGr.getValue('flow')] = true;
    }
    var flowGr = new GlideRecord('sys_hub_flow');
    flowGr.setLimit(100);
    flowGr.query();
    var unusedFlowCount = 0;
    while (flowGr.next()) {
        if (!triggeredFlows[flowGr.getUniqueValue()]) {
            unusedFlowCount++;
        }
    }
    data.costOpt.flowsNeverTriggered = unusedFlowCount;

    // 6d. Scheduled jobs that have never run
    var jobGr = new GlideRecord('sysauto_script');
    jobGr.addQuery('active', true);
    jobGr.addNullQuery('last_run_time');
    jobGr.setLimit(100);
    jobGr.query();
    var neverRunCount = 0;
    while (jobGr.next()) {
        neverRunCount++;
    }
    data.costOpt.jobsNeverRun = neverRunCount;

})();
