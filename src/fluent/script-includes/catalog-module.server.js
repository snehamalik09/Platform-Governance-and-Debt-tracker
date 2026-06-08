var GovCopilotCatalogModule = Class.create();
GovCopilotCatalogModule.prototype = {
    initialize: function() {
        this.batchSize = parseInt(gs.getProperty('x_gov_copilot.scan.batch_size', '1000'));
    },

    execute: function(scanRunSysId) {
        var total = 0;
        total += this._findNeverRequestedItems(scanRunSysId);
        total += this._findMissingApproval(scanRunSysId);
        total += this._findBrokenWorkflow(scanRunSysId);
        total += this._findBrokenFlow(scanRunSysId);
        total += this._findDuplicateItems(scanRunSysId);
        total += this._findDuplicateVariables(scanRunSysId);
        total += this._findNeverPopulatedVariables(scanRunSysId);
        return total;
    },

    _writeFinding: function(scanRunSysId, findingType, severity, affectedTable, recordSysId, recordName, title, description) {
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.initialize();
        gr.setValue('x_gov_copilot_scan_run', scanRunSysId);
        gr.setValue('x_gov_copilot_domain', 'catalog');
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

    _findNeverRequestedItems: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sc_cat_item');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var itemSysId = gr.getUniqueValue();
            var reqGr = new GlideRecord('sc_request');
            reqGr.addQuery('cat_item', itemSysId);
            reqGr.setLimit(1);
            reqGr.query();
            if (!reqGr.next()) {
                this._writeFinding(scanRunSysId, 'catalog_never_requested', 'medium', 'sc_cat_item',
                    itemSysId, gr.getDisplayValue('name'),
                    'Catalog item has never been requested',
                    'Catalog item "' + gr.getDisplayValue('name') + '" has no associated requests. Consider retiring or reviewing this unused item.');
                count++;
            }
        }
        return count;
    },

    _findMissingApproval: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sc_cat_item');
        gr.addActiveQuery();
        gr.addNullQuery('workflow');
        gr.addNullQuery('sc_ic_item_staging');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            this._writeFinding(scanRunSysId, 'catalog_missing_approval', 'high', 'sc_cat_item',
                gr.getUniqueValue(), gr.getDisplayValue('name'),
                'Catalog item has no approval workflow',
                'Catalog item "' + gr.getDisplayValue('name') + '" has no linked approval workflow or flow. Requests for this item will be auto-fulfilled without any approval gate.');
            count++;
        }
        return count;
    },

    _findBrokenWorkflow: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sc_cat_item');
        gr.addActiveQuery();
        gr.addNotNullQuery('workflow');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var wfSysId = gr.getValue('workflow');
            var wf = new GlideRecord('wf_workflow');
            if (wf.get(wfSysId) && !wf.getValue('active')) {
                this._writeFinding(scanRunSysId, 'catalog_broken_workflow', 'high', 'sc_cat_item',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'Catalog item linked to an inactive workflow',
                    'Catalog item "' + gr.getDisplayValue('name') + '" is linked to workflow "' + wf.getDisplayValue('name') + '" which is inactive. New requests will fail to process correctly.');
                count++;
            }
        }
        return count;
    },

    _findBrokenFlow: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('sc_cat_item');
        gr.addActiveQuery();
        gr.addNotNullQuery('sc_ic_item_staging');
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var flowSysId = gr.getValue('sc_ic_item_staging');
            var flow = new GlideRecord('sys_hub_flow');
            if (flow.get(flowSysId) && !flow.getValue('active')) {
                this._writeFinding(scanRunSysId, 'catalog_broken_flow', 'high', 'sc_cat_item',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'Catalog item linked to an inactive Flow Designer flow',
                    'Catalog item "' + gr.getDisplayValue('name') + '" is linked to Flow Designer flow "' + flow.getDisplayValue('name') + '" which is inactive. Requests will fail to trigger the fulfillment flow.');
                count++;
            }
        }
        return count;
    },

    _findDuplicateItems: function(scanRunSysId) {
        var count = 0;
        var seen = {};
        var reported = {};
        var gr = new GlideRecord('sc_cat_item');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var name = gr.getValue('name') || '';
            var lname = name.toLowerCase();
            if (seen[lname]) {
                if (!reported[lname]) {
                    this._writeFinding(scanRunSysId, 'catalog_duplicate_item', 'medium', 'sc_cat_item',
                        seen[lname].sysId, seen[lname].name,
                        'Duplicate catalog item name',
                        'Multiple active catalog items share the name "' + name + '". Users may submit requests to the wrong item, causing confusion and fulfillment errors.');
                    reported[lname] = true;
                    count++;
                }
                this._writeFinding(scanRunSysId, 'catalog_duplicate_item', 'medium', 'sc_cat_item',
                    gr.getUniqueValue(), name,
                    'Duplicate catalog item name',
                    'Catalog item "' + name + '" duplicates another active item with the same name.');
                count++;
            } else {
                seen[lname] = { sysId: gr.getUniqueValue(), name: name };
            }
        }
        return count;
    },

    _findDuplicateVariables: function(scanRunSysId) {
        var count = 0;
        var seen = {};
        var reported = {};
        var gr = new GlideRecord('item_option_new');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var key = gr.getValue('cat_item') + '|' + (gr.getValue('name') || '').toLowerCase();
            if (seen[key]) {
                if (!reported[key]) {
                    this._writeFinding(scanRunSysId, 'catalog_duplicate_variable', 'low', 'item_option_new',
                        seen[key], gr.getDisplayValue('name'),
                        'Duplicate variable on catalog item',
                        'Variable "' + gr.getDisplayValue('name') + '" appears more than once on catalog item "' + gr.getDisplayValue('cat_item') + '". Duplicate variables can cause data collection issues.');
                    reported[key] = true;
                    count++;
                }
                this._writeFinding(scanRunSysId, 'catalog_duplicate_variable', 'low', 'item_option_new',
                    gr.getUniqueValue(), gr.getDisplayValue('name'),
                    'Duplicate variable on catalog item',
                    'Variable "' + gr.getDisplayValue('name') + '" is duplicated on catalog item "' + gr.getDisplayValue('cat_item') + '".');
                count++;
            } else {
                seen[key] = gr.getUniqueValue();
            }
        }
        return count;
    },

    _findNeverPopulatedVariables: function(scanRunSysId) {
        var count = 0;
        var gr = new GlideRecord('item_option_new');
        gr.addActiveQuery();
        gr.setLimit(this.batchSize);
        gr.query();
        while (gr.next()) {
            var varSysId = gr.getUniqueValue();
            // Check if this variable has ever been populated in sc_item_option
            var val = new GlideRecord('sc_item_option');
            val.addQuery('item_option_new', varSysId);
            val.addNotNullQuery('value');
            val.setLimit(1);
            val.query();
            if (!val.next()) {
                this._writeFinding(scanRunSysId, 'catalog_never_populated', 'low', 'item_option_new',
                    varSysId, gr.getDisplayValue('name'),
                    'Catalog variable has never been populated',
                    'Variable "' + gr.getDisplayValue('name') + '" on catalog item "' + gr.getDisplayValue('cat_item') + '" has never been filled in by a requester. It may be unnecessary or improperly named.');
                count++;
            }
        }
        return count;
    },

    type: 'GovCopilotCatalogModule'
};
