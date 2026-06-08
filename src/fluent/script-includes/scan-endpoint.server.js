var GovCopilotScanEndpoint = Class.create();
GovCopilotScanEndpoint.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /**
     * GlideAjax method: triggers an on-demand scan and returns the result.
     * Called from the Service Portal widget via:
     *   var ga = new GlideAjax('GovCopilotScanEndpoint');
     *   ga.addParam('sysparm_name', 'triggerScan');
     *   ga.getXMLAnswer(callback);
     *
     * Returns XML with a <result> item containing:
     *   scanRunSysId, progressId, status  — on success
     *   error                             — on failure
     */
    triggerScan: function() {
        var item = this.newItem('result');
        if (!gs.hasRole('sysadmin')) {
            item.setAttribute('error', 'Access denied. Sysadmin role required.');
            return;
        }
        try {
            var orchestrator = new GovCopilotScanOrchestrator();
            var result = orchestrator.runScan();
            item.setAttribute('scanRunSysId', result.scanRunSysId);
            item.setAttribute('progressId', result.progressId);
            item.setAttribute('status', 'started');
        } catch (e) {
            item.setAttribute('error', e.message || 'Scan failed to start');
        }
    },

    type: 'GovCopilotScanEndpoint'
});
