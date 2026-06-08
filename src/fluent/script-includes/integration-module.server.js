var GovCopilotIntegrationModule = Class.create();
GovCopilotIntegrationModule.prototype = {
    initialize: function() {
        this.batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));
    },

    execute: function(scanRunSysId) {
        var total = 0;
        total += this._findMIDOffline(scanRunSysId);
        total += this._findMIDStale(scanRunSysId);
        total += this._findMIDVersionMismatch(scanRunSysId);
        total += this._findRESTUnused(scanRunSysId);
        total += this._findRESTDeprecatedEndpoint(scanRunSysId);
        total += this._findUnusedIntegrationUsers(scanRunSysId);
        return total;
    },

    _writeFinding: function(scanRunSysId, findingType, severity, affectedTable, recordSysId, recordName, title, description) {
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.initialize();
        gr.setValue('x_gov_copilot_scan_run', scanRunSysId);
        gr.setValue('x_gov_copilot_domain', 'integration');
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

    _findMIDOffline: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('ecc_agent');
        gr.addQuery('status', '!=', 'Up');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'mid_offline', 'critical', 'ecc_agent',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'MID Server is offline',
                'MID Server "' + gr.getDisplayValue('name') + '" has status "' + gr.getDisplayValue('status') + '". Offline MID Servers break all integrations and discoveries that depend on them.');
            count++;
        }
        return count;
    },

    _findMIDStale: function(scanRunSysId) {
        var count = 0;
        var sevenDaysAgo = new GlideDateTime();
        sevenDaysAgo.addDaysUTC(-7);
        var gr = new GlideRecord('ecc_agent');
        gr.addActiveQuery();
        gr.addQuery('last_ping_time', '<', sevenDaysAgo.getValue());
        gr.addNotNullQuery('last_ping_time');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'mid_stale', 'high', 'ecc_agent',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'MID Server has not pinged in over 7 days',
                'MID Server "' + gr.getDisplayValue('name') + '" last pinged on ' + gr.getDisplayValue('last_ping_time') + '. A stale MID Server may indicate connectivity issues or an unresponsive server.');
            count++;
        }
        return count;
    },

    _findMIDVersionMismatch: function(scanRunSysId) {
        var count = 0;
        var instanceVersion = gs.getProperty('glide.war', '');
        var gr = new GlideRecord('ecc_agent');
        gr.addActiveQuery();
        gr.addNotNullQuery('mid_version');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var midVersion = gr.getValue('mid_version') || '';
            if (instanceVersion && midVersion && midVersion !== instanceVersion) {
                this._writeFinding(scanRunSysId, 'mid_version_mismatch', 'high', 'ecc_agent',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'MID Server version does not match instance version',
                    'MID Server "' + gr.getDisplayValue('name') + '" is running version ' + midVersion + ' but the instance is on version ' + instanceVersion + '. Version mismatches can cause incompatibilities.');
                count++;
            }
        }
        return count;
    },

    _findRESTUnused: function(scanRunSysId) {
        var count = 0;
        var ninetyDaysAgo = new GlideDateTime();
        ninetyDaysAgo.addDaysUTC(-90);

        // Pre-build set of REST messages that have had recent calls
        var usedMessages = {};
        var log = new GlideRecord('sys_rest_message_fn_log');
        log.addQuery('sys_created_on', '>', ninetyDaysAgo.getValue());
        // No limit on pre-aggregation query — we need all recent calls
        log.query();
        while (log.next()) {
            var msgSysId = log.getValue('rest_message');
            if (msgSysId) usedMessages[msgSysId] = true;
        }

        // Flag REST messages with no recent call log entries
        var gr = new GlideRecord('sys_rest_message');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            if (!usedMessages[gr.getUniqueValue()]) {
                this._writeFinding(scanRunSysId, 'rest_unused', 'medium', 'sys_rest_message',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'REST message has not been used in 90 days',
                    'Outbound REST message "' + gr.getDisplayValue('name') + '" has no recorded outbound calls in the last 90 days. Consider deactivating unused integrations to reduce attack surface.');
                count++;
            }
        }
        return count;
    },

    _findRESTDeprecatedEndpoint: function(scanRunSysId) {
        var count = 0;
        var deprecatedPatterns = ['/api/now/v1/', '/soap.do', '_processor.do'];
        var gr = new GlideRecord('sys_rest_message');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var endpoint = gr.getValue('rest_endpoint') || '';
            for (var i = 0; i < deprecatedPatterns.length; i++) {
                if (endpoint.indexOf(deprecatedPatterns[i]) !== -1) {
                    this._writeFinding(scanRunSysId, 'rest_deprecated_endpoint', 'high', 'sys_rest_message',
                        gr.getUniqueValue(), gr.getDisplayValue('name'),
                        'REST message uses a deprecated API endpoint',
                        'Outbound REST message "' + gr.getDisplayValue('name') + '" targets a deprecated endpoint pattern ("' + deprecatedPatterns[i] + '"). Migrate to the current API version.');
                    count++;
                    break;
                }
            }
        }
        return count;
    },

    _findUnusedIntegrationUsers: function(scanRunSysId) {
        var count = 0;
        var ninetyDaysAgo = new GlideDateTime();
        ninetyDaysAgo.addDaysUTC(-90);
        var gr = new GlideRecord('sys_user');
        gr.addActiveQuery();
        gr.addQuery('roles', 'CONTAINS', 'integration');
        gr.addQuery('last_login', '<', ninetyDaysAgo.getValue());
        gr.addNotNullQuery('last_login');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'user_unused_integration', 'medium', 'sys_user',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Integration user inactive for over 90 days',
                'Integration user "' + gr.getDisplayValue('name') + '" has not logged in since ' + gr.getDisplayValue('last_login') + '. Inactive integration accounts should be reviewed and disabled.');
            count++;
        }
        return count;
    },

    type: 'GovCopilotIntegrationModule'
};
