var GovCopilotProgressWorker = Class.create();
GovCopilotProgressWorker.prototype = {
    initialize: function() {},

    /**
     * Runs the five domain modules sequentially and finalises the scan.
     * Called asynchronously by GlideScriptedHierarchicalWorker.
     * scanRunSysId is passed as a direct function argument (AC-F01, AC-F05).
     */
    process: function(scanRunSysId) {
        var modules = [
            { moduleClass: 'GovCopilotPerformanceModule',  domain: 'performance'  },
            { moduleClass: 'GovCopilotSecurityModule',     domain: 'security'     },
            { moduleClass: 'GovCopilotIntegrationModule',  domain: 'integration'  },
            { moduleClass: 'GovCopilotCatalogModule',      domain: 'catalog'      },
            { moduleClass: 'GovCopilotCMDBModule',         domain: 'cmdb'         }
        ];

        var anyFailed = false;

        for (var i = 0; i < modules.length; i++) {
            var result = this._runModule(modules[i].moduleClass, modules[i].domain, scanRunSysId);
            if (result === -1) {
                anyFailed = true;
            }
        }

        this._onAllComplete(scanRunSysId, anyFailed);
    },

    /**
     * Try/catch wrapper for a single domain module.
     * Increments modules_completed on success or modules_failed on failure.
     * Returns finding count on success, -1 on failure (AC-F05).
     */
    _runModule: function(moduleClass, domain, scanRunSysId) {
        try {
            var module;
            if (moduleClass === 'GovCopilotPerformanceModule') {
                module = new GovCopilotPerformanceModule();
            } else if (moduleClass === 'GovCopilotSecurityModule') {
                module = new GovCopilotSecurityModule();
            } else if (moduleClass === 'GovCopilotIntegrationModule') {
                module = new GovCopilotIntegrationModule();
            } else if (moduleClass === 'GovCopilotCatalogModule') {
                module = new GovCopilotCatalogModule();
            } else if (moduleClass === 'GovCopilotCMDBModule') {
                module = new GovCopilotCMDBModule();
            } else {
                throw new Error('Unknown module class: ' + moduleClass);
            }
            var findingCount = module.execute(scanRunSysId);

            // Increment modules_completed
            var sr = new GlideRecord('x_gov_copilot_scan_run');
            if (sr.get(scanRunSysId)) {
                var completed = parseInt(sr.getValue('x_gov_copilot_modules_completed') || '0', 10) + 1;
                sr.setValue('x_gov_copilot_modules_completed', completed);
                sr.update();
            }

            return findingCount;
        } catch (e) {
            gs.error('GovCopilotProgressWorker: module ' + moduleClass + ' failed for scan ' + scanRunSysId + ': ' + e.message);

            // Increment modules_failed
            var srFail = new GlideRecord('x_gov_copilot_scan_run');
            if (srFail.get(scanRunSysId)) {
                var failed = parseInt(srFail.getValue('x_gov_copilot_modules_failed') || '0', 10) + 1;
                srFail.setValue('x_gov_copilot_modules_failed', failed);
                srFail.update();
            }

            return -1;
        }
    },

    /**
     * Finalises the scan_run after all modules have run.
     * - partial (anyFailed=true):  status=partial, overall_health_score=null
     * - completed (anyFailed=false): call ScoringEngine, status=completed
     * Both paths: set completed_at, duration_seconds, call AIEngine + NotificationService.
     */
    _onAllComplete: function(scanRunSysId, anyFailed) {
        var sr = new GlideRecord('x_gov_copilot_scan_run');
        if (!sr.get(scanRunSysId)) {
            gs.error('GovCopilotProgressWorker: could not load scan_run ' + scanRunSysId + ' for completion.');
            return;
        }

        // Calculate duration
        var started = new GlideDateTime(sr.getValue('x_gov_copilot_started_at'));
        var now = new GlideDateTime();
        var diffMs = GlideDateTime.subtract(now, started).getNumericValue();
        var durationSeconds = Math.round(diffMs / 1000);

        if (anyFailed) {
            // Partial scan — suppress overall score
            sr.setValue('x_gov_copilot_status', 'partial');
            sr.setValue('x_gov_copilot_overall_health_score', null);

            // Calculate domain scores for whatever domains completed
            var scoringEnginePartial = new GovCopilotScoringEngine();
            var domainsPartial = ['performance', 'security', 'integration', 'catalog', 'cmdb'];
            for (var di = 0; di < domainsPartial.length; di++) {
                try {
                    scoringEnginePartial.calculateDomainScore(domainsPartial[di], scanRunSysId);
                } catch (e) {
                    gs.warn('GovCopilotProgressWorker: calculateDomainScore failed for ' + domainsPartial[di] + ' — ' + (e.message || e));
                }
            }
            // Write severity counts even for partial scans so the dashboard tiles are correct
            scoringEnginePartial.updateScanRunCounts(scanRunSysId);
        } else {
            // Full scan — calculate scores and counts first, then mark completed
            var scoringEngine = new GovCopilotScoringEngine();
            var domains = ['performance', 'security', 'integration', 'catalog', 'cmdb'];
            for (var di = 0; di < domains.length; di++) {
                try {
                    scoringEngine.calculateDomainScore(domains[di], scanRunSysId);
                } catch (e) {
                    gs.warn('GovCopilotProgressWorker: calculateDomainScore failed for ' + domains[di] + ' — ' + e.message);
                }
            }
            scoringEngine.calculateOverallHealthScore(scanRunSysId);
            scoringEngine.updateScanRunCounts(scanRunSysId);

            // Re-fetch record after scoring engine updates it
            sr = new GlideRecord('x_gov_copilot_scan_run');
            if (!sr.get(scanRunSysId)) {
                gs.error('GovCopilotProgressWorker: could not reload scan_run after scoring — ' + scanRunSysId);
                var fallback = new GlideRecord('x_gov_copilot_scan_run');
                if (fallback.get(scanRunSysId)) {
                    fallback.setValue('x_gov_copilot_status', 'partial');
                    fallback.setValue('x_gov_copilot_completed_at', new GlideDateTime());
                    fallback.update();
                }
                return;
            }
            sr.setValue('x_gov_copilot_status', 'completed');
        }

        sr.setValue('x_gov_copilot_completed_at',     now);
        sr.setValue('x_gov_copilot_duration_seconds', durationSeconds);
        sr.update();

        // Generate AI recommendations (both partial and completed)
        try {
            var aiEngine = new GovCopilotAIEngine();
            aiEngine.generateRecommendations(scanRunSysId);
        } catch (e) {
            gs.error('GovCopilotProgressWorker: AIEngine.generateRecommendations failed for ' + scanRunSysId + ': ' + e.message);
        }

        // Send post-scan notification email (both partial and completed)
        try {
            var notifService = new GovCopilotNotificationService();
            notifService.sendPostScanEmail(scanRunSysId);
        } catch (e) {
            gs.error('GovCopilotProgressWorker: NotificationService.sendPostScanEmail failed for ' + scanRunSysId + ': ' + e.message);
        }
    },

    type: 'GovCopilotProgressWorker'
};
