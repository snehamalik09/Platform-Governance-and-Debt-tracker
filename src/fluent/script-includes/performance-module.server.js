var GovCopilotPerformanceModule = Class.create();
GovCopilotPerformanceModule.prototype = {
    initialize: function() {
        this.batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));
    },

    /**
     * Run all 10 performance finding detectors. Returns total finding count.
     */
    execute: function(scanRunSysId) {
        var total = 0;
        total += this._findBRAlwaysRun(scanRunSysId);
        total += this._findBRShouldBeAsync(scanRunSysId);
        total += this._findBRRecursivePattern(scanRunSysId);
        total += this._findBRGlideRecordInLoop(scanRunSysId);
        total += this._findBRExcessiveDotWalking(scanRunSysId);
        total += this._findJobLongRunning(scanRunSysId);
        total += this._findJobFrequentlyFailing(scanRunSysId);
        total += this._findJobOrphaned(scanRunSysId);
        total += this._findJobDuplicate(scanRunSysId);
        total += this._findJobNotRunRecently(scanRunSysId);
        return total;
    },

    _writeFinding: function(scanRunSysId, findingType, severity, affectedTable, recordSysId, recordName, title, description) {
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.initialize();
        gr.setValue('x_gov_copilot_scan_run', scanRunSysId);
        gr.setValue('x_gov_copilot_domain', 'performance');
        gr.setValue('x_gov_copilot_finding_type', findingType);
        gr.setValue('x_gov_copilot_title', title);
        gr.setValue('x_gov_copilot_description', description);
        gr.setValue('x_gov_copilot_severity', severity);
        gr.setValue('x_gov_copilot_affected_table', affectedTable);
        gr.setValue('x_gov_copilot_affected_record_sys_id', recordSysId);
        gr.setValue('x_gov_copilot_affected_record_name', recordName);
        gr.setValue('x_gov_copilot_remediation_status', 'open');
        gr.insert();
    },

    // ── Business Rule checks ────────────────────────────────────────────────

    /** BR: Always Run — BRs that run on every operation */
    _findBRAlwaysRun: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_script');
        gr.addQuery('when_to_run', 'always');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'br_always_run', 'high', 'sys_script',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Business Rule runs on every operation',
                'Business rule "' + gr.getDisplayValue('name') + '" is configured to run on all operations (always). This causes performance degradation on every database operation on table ' + gr.getValue('collection') + '.');
            count++;
        }
        return count;
    },

    /** BR: Should Be Async — long synchronous BRs (heuristic: script > 500 chars) */
    _findBRShouldBeAsync: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_script');
        gr.addQuery('when_to_run', '!=', 'async');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var script = gr.getValue('script') || '';
            if (script.length > 500) {
                this._writeFinding(scanRunSysId, 'br_should_be_async', 'medium', 'sys_script',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'Synchronous business rule may need async execution',
                    'Business rule "' + gr.getDisplayValue('name') + '" runs synchronously and has a complex script (>500 chars). Consider converting to async to avoid blocking user operations.');
                count++;
            }
        }
        return count;
    },

    /** BR: Recursive Pattern — script queries same table as the BR's collection */
    _findBRRecursivePattern: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_script');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var collection = gr.getValue('collection') || '';
            var script = gr.getValue('script') || '';
            if (collection) {
                var singleQ = "GlideRecord('" + collection + "')";
                var doubleQ = 'GlideRecord("' + collection + '")';
                if (script.indexOf(singleQ) !== -1 || script.indexOf(doubleQ) !== -1) {
                    this._writeFinding(scanRunSysId, 'br_recursive_pattern', 'high', 'sys_script',
                        gr.getUniqueValue(), gr.getDisplayValue('name'),
                        'Business rule may cause recursive loop',
                        'Business rule "' + gr.getDisplayValue('name') + '" queries its own table (' + collection + '), which can trigger recursive execution and cause transaction timeouts.');
                    count++;
                }
            }
        }
        return count;
    },

    /** BR: GlideRecord in Loop — new GlideRecord() inside while/for loop */
    _findBRGlideRecordInLoop: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_script');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var script = gr.getValue('script') || '';
            // Two-pass: detect loop keyword AND GlideRecord instantiation (conservative — may have false positives)
            var hasLoop = /(while|for)\s*\(/.test(script);
            var hasGR = /new\s+GlideRecord\s*\(/.test(script);
            if (hasLoop && hasGR) {
                this._writeFinding(scanRunSysId, 'br_gliderecord_in_loop', 'high', 'sys_script',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'GlideRecord instantiated inside a loop',
                    'Business rule "' + gr.getDisplayValue('name') + '" contains both a loop and a GlideRecord instantiation. This may result in N+1 database queries. Review to confirm GlideRecord is not created inside the loop body.');
                count++;
            }
        }
        return count;
    },

    /** BR: Excessive Dot-Walking — reference chain depth > 3 */
    _findBRExcessiveDotWalking: function(scanRunSysId) {
        var count = 0;
        var dotWalkPattern = /\w+\.\w+\.\w+\.\w+/;
        var gr = new GlideRecord('sys_script');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var script = gr.getValue('script') || '';
            if (dotWalkPattern.test(script)) {
                this._writeFinding(scanRunSysId, 'br_excessive_dot_walking', 'medium', 'sys_script',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'Excessive dot-walking in business rule script',
                    'Business rule "' + gr.getDisplayValue('name') + '" uses reference chains deeper than 3 levels (e.g. current.field1.field2.field3.field4). Each dot-walk triggers an additional database query.');
                count++;
            }
        }
        return count;
    },

    // ── Scheduled Job checks ────────────────────────────────────────────────

    /** Job: Long-Running — average duration > 300,000 ms */
    _findJobLongRunning: function(scanRunSysId) {
        var count = 0;
        var reported = {};

        // Query run history for long-running executions (duration > 300 seconds)
        // sysauto_script_run_history has: scheduled_job (ref to sysauto_script), run_time (duration in ms), status
        var gr = new GlideRecord('sysauto_script_run_history');
        gr.addQuery('run_time', '>', 300000);
        gr.addQuery('status', 'success'); // Only count successful (completed) runs
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var jobSysId = gr.getValue('scheduled_job');
            if (jobSysId && !reported[jobSysId]) {
                reported[jobSysId] = true;
                var jobName = gr.getDisplayValue('scheduled_job');
                var duration = parseInt(gr.getValue('run_time') || '0');
                this._writeFinding(scanRunSysId, 'job_long_running', 'high', 'sysauto_script',
                    jobSysId, jobName,
                    'Scheduled job has long run duration',
                    'Scheduled job "' + jobName + '" has run for over ' + Math.round(duration/1000) + ' seconds (threshold: 300s). Review job logic for optimization opportunities.');
                count++;
            }
        }
        return count;
    },

    /** Job: Frequently Failing — failure rate > 20% in last 30 days */
    _findJobFrequentlyFailing: function(scanRunSysId) {
        var count = 0;
        var thirtyDaysAgo = new GlideDateTime();
        thirtyDaysAgo.addDaysUTC(-30);

        // Build per-job run and failure counts from history
        var jobStats = {};
        var gr = new GlideRecord('sysauto_script_run_history');
        gr.addQuery('sys_created_on', '>', thirtyDaysAgo.getValue());
        gr.setLimit(this.batchSize * 5);
        gr.query();
        while (gr.next()) {
            var jobSysId = gr.getValue('scheduled_job');
            if (!jobSysId) continue;
            if (!jobStats[jobSysId]) {
                jobStats[jobSysId] = { name: gr.getDisplayValue('scheduled_job'), runs: 0, failures: 0 };
            }
            jobStats[jobSysId].runs++;
            var status = gr.getValue('status') || '';
            if (status !== 'success' && status !== 'running') {
                jobStats[jobSysId].failures++;
            }
        }

        for (var sysId in jobStats) {
            var stats = jobStats[sysId];
            if (stats.runs > 0 && (stats.failures / stats.runs) > 0.20) {
                this._writeFinding(scanRunSysId, 'job_frequently_failing', 'high', 'sysauto_script',
                    sysId, stats.name,
                    'Scheduled job has high failure rate',
                    'Scheduled job "' + stats.name + '" failed ' + stats.failures + ' out of ' + stats.runs + ' runs in the last 30 days (' + Math.round(stats.failures/stats.runs*100) + '%). Review job logic and error handling.');
                count++;
            }
        }
        return count;
    },

    /** Job: Orphaned — active but never run */
    _findJobOrphaned: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sysauto_script');
        gr.addActiveQuery();
        gr.addNullQuery('last_run_time');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'job_orphaned', 'medium', 'sysauto_script',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Scheduled job is active but has never run',
                'Scheduled job "' + gr.getDisplayValue('name') + '" is active but has no last_run_time recorded. It may be misconfigured or stuck in a disabled state.');
            count++;
        }
        return count;
    },

    /** Job: Duplicate — multiple active jobs with the same name */
    _findJobDuplicate: function(scanRunSysId) {
        var count = 0;
        // Find names that appear more than once
        var seen = {};
        var reported = {};
        var gr = new GlideRecord('sysauto_script');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var name = gr.getValue('name') || '';
            if (seen[name]) {
                if (!reported[name]) {
                    // Report the first duplicate (already seen)
                    this._writeFinding(scanRunSysId, 'job_duplicate', 'medium', 'sysauto_script',
                        seen[name].sysId, name,
                        'Duplicate scheduled job name',
                        'Multiple active scheduled jobs share the name "' + name + '". Duplicate jobs can cause unexpected double-execution of scheduled tasks.');
                    reported[name] = true;
                    count++;
                }
                this._writeFinding(scanRunSysId, 'job_duplicate', 'medium', 'sysauto_script',
                    gr.getUniqueValue(), name,
                    'Duplicate scheduled job name',
                    'Scheduled job "' + name + '" (sys_id: ' + gr.getUniqueValue() + ') is a duplicate. Multiple active jobs with this name exist.');
                count++;
            } else {
                seen[name] = { sysId: gr.getUniqueValue() };
            }
        }
        return count;
    },

    /** Job: Not Run Recently — active but last run > 60 days ago */
    _findJobNotRunRecently: function(scanRunSysId) {
        var count = 0;
        var sixtyDaysAgo = new GlideDateTime();
        sixtyDaysAgo.addDaysUTC(-60);

        var gr = new GlideRecord('sysauto_script');
        gr.addActiveQuery();
        gr.addQuery('last_run_time', '<', sixtyDaysAgo.getValue());
        gr.addNotNullQuery('last_run_time');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'job_not_run_recently', 'low', 'sysauto_script',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Scheduled job has not run in over 60 days',
                'Scheduled job "' + gr.getDisplayValue('name') + '" is active but has not run in over 60 days. It may be stale or its schedule may be misconfigured.');
            count++;
        }
        return count;
    },

    type: 'GovCopilotPerformanceModule'
};
