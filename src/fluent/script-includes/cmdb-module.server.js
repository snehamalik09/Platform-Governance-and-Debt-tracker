var GovCopilotCMDBModule = Class.create();
GovCopilotCMDBModule.prototype = {
    initialize: function() {
        this.batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));
    },

    execute: function(scanRunSysId) {
        var total = 0;
        total += this._findDuplicateCIs(scanRunSysId);
        total += this._findNoOwnerCIs(scanRunSysId);
        total += this._findNoSupportGroupCIs(scanRunSysId);
        total += this._findNoRelationshipCIs(scanRunSysId);
        total += this._findStaleCIs(scanRunSysId);
        total += this._findCriticalNoOwner(scanRunSysId);
        total += this._findCriticalNoSupport(scanRunSysId);
        return total;
    },

    _writeFinding: function(scanRunSysId, findingType, severity, affectedTable, recordSysId, recordName, title, description) {
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.initialize();
        gr.setValue('x_gov_copilot_scan_run', scanRunSysId);
        gr.setValue('x_gov_copilot_domain', 'cmdb');
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

    _findDuplicateCIs: function(scanRunSysId) {
        var count = 0;
        // Find CIs sharing a serial_number
        var seenSerial = {};
        var reportedSerial = {};
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.addNotNullQuery('serial_number');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var serial = gr.getValue('serial_number');
            if (seenSerial[serial]) {
                if (!reportedSerial[serial]) {
                    this._writeFinding(scanRunSysId, 'cmdb_duplicate_ci', 'high', 'cmdb_ci',
                        seenSerial[serial].sysId, seenSerial[serial].name,
                        'Duplicate CI detected (serial number)',
                        'CI "' + seenSerial[serial].name + '" shares serial number "' + serial + '" with another CI. Duplicate CIs cause inaccurate CMDB data and unreliable discovery.');
                    reportedSerial[serial] = true;
                    count++;
                }
                this._writeFinding(scanRunSysId, 'cmdb_duplicate_ci', 'high', 'cmdb_ci',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'Duplicate CI detected (serial number)',
                    'CI "' + gr.getDisplayValue('name') + '" shares serial number "' + serial + '" with another CI.');
                count++;
            } else {
                seenSerial[serial] = { sysId: gr.getUniqueValue(), name: gr.getDisplayValue('name') };
            }
        }
        return count;
    },

    _findNoOwnerCIs: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.addNullQuery('assigned_to');
        // Use INSTANCEOF to include all server and network device subclasses
        var classQuery = gr.addQuery('sys_class_name', 'INSTANCEOF', 'cmdb_ci_server');
        classQuery.addOrCondition('sys_class_name', 'INSTANCEOF', 'cmdb_ci_network_device');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'cmdb_no_owner', 'high', 'cmdb_ci',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'CI has no assigned owner',
                'CI "' + gr.getDisplayValue('name') + '" (' + gr.getValue('sys_class_name') + ') has no assigned owner (assigned_to is empty). Unowned CIs cannot be escalated during incidents.');
            count++;
        }
        return count;
    },

    _findNoSupportGroupCIs: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.addNullQuery('support_group');
        gr.addQuery('operational_status', '1'); // 1 = operational
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'cmdb_no_support_group', 'high', 'cmdb_ci',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Operational CI has no support group',
                'CI "' + gr.getDisplayValue('name') + '" is operational but has no support group assigned. Incidents against this CI cannot be routed to the correct team.');
            count++;
        }
        return count;
    },

    _findNoRelationshipCIs: function(scanRunSysId) {
        var count = 0;

        // Pre-build set of all CIs that appear in at least one relationship
        var cisWithRelationships = {};
        var rel = new GlideRecord('cmdb_rel_ci');
        // No limit — we need all relationships for accurate detection
        rel.query();
        while (rel.next()) {
            var p = rel.getValue('parent');
            var c = rel.getValue('child');
            if (p) cisWithRelationships[p] = true;
            if (c) cisWithRelationships[c] = true;
        }

        // Find active CIs not in the relationship set
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            if (!cisWithRelationships[gr.getUniqueValue()]) {
                this._writeFinding(scanRunSysId, 'cmdb_no_relationships', 'medium', 'cmdb_ci',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'CI has no CMDB relationships',
                    'CI "' + gr.getDisplayValue('name') + '" has no parent or child relationships in the CMDB. Isolated CIs reduce the accuracy of impact analysis during incidents.');
                count++;
            }
        }
        return count;
    },

    _findStaleCIs: function(scanRunSysId) {
        var count = 0;
        var ninetyDaysAgo = new GlideDateTime();
        ninetyDaysAgo.addDaysUTC(-90);
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.addQuery('last_discovered', '<', ninetyDaysAgo.getValue());
        gr.addNotNullQuery('last_discovered');
        gr.addQuery('discovery_source', '!=', 'manual');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'cmdb_stale', 'high', 'cmdb_ci',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'CI has not been discovered in over 90 days',
                'CI "' + gr.getDisplayValue('name') + '" was last discovered on ' + gr.getDisplayValue('last_discovered') + '. Stale discovery data reduces CMDB accuracy and incident response effectiveness.');
            count++;
        }
        return count;
    },

    _findCriticalNoOwner: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.addQuery('used_for', 'Production');
        gr.addNullQuery('assigned_to');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'cmdb_critical_no_owner', 'critical', 'cmdb_ci',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Production CI has no assigned owner',
                'CI "' + gr.getDisplayValue('name') + '" is used in Production but has no assigned owner. This is a critical governance gap — production assets must have accountable owners.');
            count++;
        }
        return count;
    },

    _findCriticalNoSupport: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('cmdb_ci');
        gr.addActiveQuery();
        gr.addNullQuery('support_group');
        gr.addNullQuery('assigned_to');
        gr.addQuery('used_for', 'Production');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'cmdb_critical_no_support', 'critical', 'cmdb_ci',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Production CI has no support group and no owner',
                'CI "' + gr.getDisplayValue('name') + '" is used in Production and has neither a support group nor an assigned owner. Incidents against this CI cannot be escalated or routed.');
            count++;
        }
        return count;
    },

    type: 'GovCopilotCMDBModule'
};
