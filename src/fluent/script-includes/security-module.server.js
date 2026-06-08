var GovCopilotSecurityModule = Class.create();
GovCopilotSecurityModule.prototype = {
    initialize: function() {
        this.batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));
    },

    execute: function(scanRunSysId) {
        var total = 0;
        total += this._findACLNoReadControl(scanRunSysId);
        total += this._findACLOverlyPermissive(scanRunSysId);
        total += this._findDormantAdmins(scanRunSysId);
        total += this._findInactiveServiceAccounts(scanRunSysId);
        total += this._findBasicAuthUsers(scanRunSysId);
        total += this._findHardcodedCredentials(scanRunSysId);
        total += this._findDeprecatedAuth(scanRunSysId);
        total += this._findUnencryptedIntegrations(scanRunSysId);
        return total;
    },

    _writeFinding: function(scanRunSysId, findingType, severity, affectedTable, recordSysId, recordName, title, description) {
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.initialize();
        gr.setValue('x_gov_copilot_scan_run', scanRunSysId);
        gr.setValue('x_gov_copilot_domain', 'security');
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

    /** ACL: No Read Control — tables with no 'read' ACL */
    _findACLNoReadControl: function(scanRunSysId) {
        var count = 0;
        // Build set of tables that DO have a read ACL
        var tablesWithReadACL = {};
        var readAcl = new GlideRecord('sys_security_acl');
        readAcl.addQuery('operation', 'read');
        readAcl.addActiveQuery();
        // No setLimit — we need all read ACLs to avoid false positives
        readAcl.query();
        while (readAcl.next()) {
            tablesWithReadACL[readAcl.getValue('name')] = true;
        }

        // Find tables that have non-read ACLs but no read ACL
        var reported = {};
        var otherAcl = new GlideRecord('sys_security_acl');
        otherAcl.addQuery('operation', '!=', 'read');
        otherAcl.addActiveQuery();
        otherAcl.setLimit(this.batchSize * 5);
        otherAcl.query();
        while (otherAcl.next()) {
            var tName = otherAcl.getValue('name') || '';
            if (!tablesWithReadACL[tName] && !reported[tName]) {
                reported[tName] = true;
                this._writeFinding(scanRunSysId, 'acl_no_read_control', 'critical', 'sys_security_acl',
                    otherAcl.getUniqueValue(), tName,
                    'Table has no Read ACL',
                    'Table "' + tName + '" has ACL entries but no ACL for the "read" operation. Unauthenticated or unprivileged users may be able to read records from this table.');
                count++;
            }
        }
        return count;
    },

    /** ACL: Overly Permissive — no roles AND no condition */
    _findACLOverlyPermissive: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_security_acl');
        gr.addActiveQuery();
        gr.addNullQuery('roles');
        gr.addNullQuery('condition');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'acl_overly_permissive', 'high', 'sys_security_acl',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'ACL has no role or condition restriction',
                'ACL "' + gr.getDisplayValue('name') + '" has no roles and no condition expression. This means any authenticated user can perform this operation on this table.');
            count++;
        }
        return count;
    },

    /** Account: Dormant Admin — admin role, active, last_login > 60 days */
    _findDormantAdmins: function(scanRunSysId) {
        var count = 0;
        var sixtyDaysAgo = new GlideDateTime();
        sixtyDaysAgo.addDaysUTC(-60);

        var gr = new GlideRecord('sys_user');
        gr.addActiveQuery();
        gr.addQuery('roles', 'CONTAINS', 'admin');
        gr.addQuery('last_login', '<', sixtyDaysAgo.getValue());
        gr.addNotNullQuery('last_login');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'account_dormant_admin', 'critical', 'sys_user',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Admin account has not logged in for over 60 days',
                'User "' + gr.getDisplayValue('name') + '" has administrator privileges but has not logged in since ' + gr.getDisplayValue('last_login') + '. Dormant admin accounts are a significant security risk.');
            count++;
        }
        return count;
    },

    /** Account: Inactive Service Account — name contains svc/service, last_login > 90 days */
    _findInactiveServiceAccounts: function(scanRunSysId) {
        var count = 0;
        var ninetyDaysAgo = new GlideDateTime();
        ninetyDaysAgo.addDaysUTC(-90);

        var gr = new GlideRecord('sys_user');
        gr.addActiveQuery();
        var qc = gr.addQuery('user_name', 'CONTAINS', 'svc');
        qc.addOrCondition('user_name', 'CONTAINS', 'service');
        gr.addQuery('last_login', '<', ninetyDaysAgo.getValue());
        gr.addNotNullQuery('last_login');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'account_inactive_service', 'high', 'sys_user',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Service account inactive for over 90 days',
                'Service account "' + gr.getDisplayValue('name') + '" has not logged in since ' + gr.getDisplayValue('last_login') + '. Inactive service accounts should be disabled or removed.');
            count++;
        }
        return count;
    },

    /** Account: Basic Auth — auth_method=basic AND active */
    _findBasicAuthUsers: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_user');
        gr.addActiveQuery();
        gr.addQuery('auth_method', 'basic');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'account_basic_auth', 'high', 'sys_user',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'User account uses basic authentication',
                'User "' + gr.getDisplayValue('name') + '" uses basic (username/password) authentication. Modern SSO/MFA should be used instead to reduce credential exposure risk.');
            count++;
        }
        return count;
    },

    /** Script: Hardcoded Credential — regex patterns in sys_script and sys_script_include */
    _findHardcodedCredentials: function(scanRunSysId) {
        var count = 0;
        // Conservative credential patterns — check for common credential assignment patterns
        // IMPORTANT: We only store the record metadata, NOT the credential value itself (AC-N06)
        var patterns = [
            /password\s*=\s*['"][^'"]{4,}['"]/i,
            /api_key\s*=\s*['"][^'"]{8,}['"]/i,
            /secret\s*=\s*['"][^'"]{4,}['"]/i,
            /token\s*=\s*['"][^'"]{8,}['"]/i
        ];
        var tables = ['sys_script', 'sys_script_include'];
        for (var t = 0; t < tables.length; t++) {
            var gr = new GlideRecord(tables[t]);
            gr.addActiveQuery();
            gr.setLimit(this.batchSize);
            gr.query();
            while (gr.next()) {
                var script = gr.getValue('script') || '';
                for (var p = 0; p < patterns.length; p++) {
                    if (patterns[p].test(script)) {
                        this._writeFinding(scanRunSysId, 'script_hardcoded_credential', 'critical', tables[t],
                            gr.getUniqueValue(), gr.getDisplayValue('name'),
                            'Potential hardcoded credential in script',
                            'Script "' + gr.getDisplayValue('name') + '" in ' + tables[t] + ' may contain a hardcoded credential (matched pattern: ' + patterns[p].source.split('=')[0].trim() + '). Credentials must be stored in System Properties, not in code.');
                        count++; // Fixed: increment per finding, inside the while loop
                        break; // One finding per script, even if multiple patterns match
                    }
                }
            }
        }
        return count;
    },

    /** Integration: Deprecated Auth — REST message using basic auth */
    _findDeprecatedAuth: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_rest_message');
        gr.addActiveQuery();
        gr.addQuery('authentication_type', 'basic');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'integration_deprecated_auth', 'medium', 'sys_rest_message',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'REST message uses basic authentication',
                'Outbound REST message "' + gr.getDisplayValue('name') + '" uses basic authentication. Consider upgrading to OAuth 2.0 or API key authentication for better security.');
            count++;
        }
        return count;
    },

    /** Integration: Unencrypted — REST message endpoint not using HTTPS */
    _findUnencryptedIntegrations: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sys_rest_message');
        gr.addActiveQuery();
        gr.addQuery('rest_endpoint', 'STARTSWITH', 'http://');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'integration_unencrypted', 'high', 'sys_rest_message',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'REST message endpoint uses unencrypted HTTP',
                'Outbound REST message "' + gr.getDisplayValue('name') + '" uses an unencrypted HTTP endpoint. All integrations must use encrypted HTTPS connections.');
            count++;
        }
        return count;
    },

    type: 'GovCopilotSecurityModule'
};
