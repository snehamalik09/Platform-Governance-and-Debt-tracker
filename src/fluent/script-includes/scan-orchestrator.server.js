var GovCopilotScanOrchestrator = Class.create();
GovCopilotScanOrchestrator.prototype = {
    initialize: function() {},

    /**
     * Entry point: validates weights, checks concurrency, creates scan_run,
     * launches the ProgressWorker, and returns scan metadata.
     * Throws Error on validation failure (AC-F02, AC-F03).
     */
    runScan: function() {
        this._validateWeights();

        if (this._isAlreadyRunning()) {
            throw new Error('A scan is already running. Please wait for it to complete.');
        }

        var sysId = this._createScanRun();
        var progressId = this._launchProgressWorker(sysId);

        return { scanRunSysId: sysId, progressId: progressId, status: 'started' };
    },

    /**
     * Reads five weight system properties and verifies they sum to 100.
     * Throws Error if they do not (AC-F03).
     */
    _validateWeights: function() {
        var security    = parseInt(gs.getProperty('x_gov_copilot.scoring.weight.security',    '25'), 10);
        var performance = parseInt(gs.getProperty('x_gov_copilot.scoring.weight.performance', '25'), 10);
        var cmdb        = parseInt(gs.getProperty('x_gov_copilot.scoring.weight.cmdb',        '20'), 10);
        var integration = parseInt(gs.getProperty('x_gov_copilot.scoring.weight.integration', '15'), 10);
        var catalog     = parseInt(gs.getProperty('x_gov_copilot.scoring.weight.catalog',     '15'), 10);

        var total = security + performance + cmdb + integration + catalog;
        if (total !== 100) {
            throw new Error('Domain weights must sum to 100. Current sum: ' + total);
        }
    },

    /**
     * Returns true when any scan_run record has status=running (AC-F02).
     */
    _isAlreadyRunning: function() {
        var gr = new GlideRecord('x_gov_copilot_scan_run');
        gr.addQuery('x_gov_copilot_status', 'running');
        gr.setLimit(1);
        gr.query();
        return gr.next();
    },

    /**
     * Inserts a new scan_run record in 'running' state and returns its sys_id.
     */
    _createScanRun: function() {
        var scanName = this._generateScanName();

        var gr = new GlideRecord('x_gov_copilot_scan_run');
        gr.initialize();
        gr.setValue('x_gov_copilot_name',            scanName);
        gr.setValue('x_gov_copilot_status',          'running');
        gr.setValue('x_gov_copilot_triggered_by',    'manual');
        gr.setValue('x_gov_copilot_scan_type',       'on_demand');
        gr.setValue('x_gov_copilot_started_at',      new GlideDateTime());
        gr.setValue('x_gov_copilot_modules_completed', 0);
        gr.setValue('x_gov_copilot_modules_failed',    0);
        gr.setValue('x_gov_copilot_total_findings',    0);
        gr.setValue('x_gov_copilot_critical_count',    0);
        gr.setValue('x_gov_copilot_high_count',        0);
        gr.setValue('x_gov_copilot_medium_count',      0);
        gr.setValue('x_gov_copilot_low_count',         0);
        var sysId = gr.insert();
        return sysId;
    },

    /**
     * Generates a human-readable scan name: Scan-YYYY-MM-DD-NNN
     */
    _generateScanName: function() {
        var countAgg = new GlideAggregate('x_gov_copilot_scan_run');
        countAgg.addAggregate('COUNT');
        countAgg.query();
        var scanNum = 1;
        if (countAgg.next()) {
            scanNum = parseInt(countAgg.getAggregate('COUNT'), 10) + 1;
        }
        var dateStr = new GlideDate().getValue();
        var numStr = scanNum < 10 ? '00' + scanNum : (scanNum < 100 ? '0' + scanNum : '' + scanNum);
        return 'Scan-' + dateStr + '-' + numStr;
    },

    /**
     * Starts GovCopilotProgressWorker asynchronously via
     * GlideScriptedHierarchicalWorker (AC-N08).
     * Returns the progress tracker ID.
     */
    _launchProgressWorker: function(scanRunSysId) {
        var worker = new GlideScriptedHierarchicalWorker();
        worker.setProgressName('Platform Governance Scan');
        worker.setScriptIncludeName('x_gov_copilot.GovCopilotProgressWorker');
        worker.setScriptIncludeMethod('process');
        worker.putMethodArg('scanRunSysId', scanRunSysId);
        worker.setBackground(true);
        worker.start();
        return worker.getProgressID();
    },

    type: 'GovCopilotScanOrchestrator'
};
