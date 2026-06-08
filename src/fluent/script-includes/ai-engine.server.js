// GovCopilotAIEngine — Script Include
// Generates AI-powered recommendations for scan findings via the Claude API.
// Security: Only finding metadata (domain, finding_type, severity, affected_table,
//           affected_record_name, affected_count) is ever sent to the API.
//           No PII, no field values, no credential content. (AC-N06)
// API key is always read from sys_property — never hardcoded. (AC-N05)
// All outbound calls use the pre-configured GovCopilotClaudeAPI REST message (HTTPS). (AC-N07)

var GovCopilotAIEngine = Class.create();
GovCopilotAIEngine.prototype = {
    initialize: function() {},

    // ---------------------------------------------------------------------------
    // PUBLIC: generateRecommendations
    // Queries all findings for a scan run, batches them in groups of 10,
    // calls Claude for each batch, stores results or applies fallback on failure.
    //
    // Batch logic test note (AC acceptance):
    //   25 findings → batches of sizes [10, 10, 5] → 3 API calls
    // ---------------------------------------------------------------------------
    generateRecommendations: function(scanRunSysId) {
        var AI_BATCH_SIZE = 10;

        // Guard: check API key first — if missing, apply fallback for everything
        var apiKey = gs.getProperty('x_gov_copilot.ai.api_key', '');
        if (!apiKey || apiKey === '') {
            gs.warn('GovCopilotAIEngine: x_gov_copilot.ai.api_key is not set. Applying fallback for all findings in scan ' + scanRunSysId);
            this._applyFallbackForScan(scanRunSysId, 'API key not configured');
            return;
        }

        // Read model once — passed down to _buildRequestPayload and _storeRecommendation
        var model = gs.getProperty('x_gov_copilot.ai.model', 'claude-haiku-4-5');

        // Collect all findings for this scan run
        var findings = [];
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.addQuery('x_gov_copilot_scan_run', scanRunSysId);
        gr.query();
        gr.setLimit(500);
        while (gr.next()) {
            findings.push({
                sys_id: gr.getUniqueValue(),
                finding_id: gr.getUniqueValue(),
                domain: gr.getValue('x_gov_copilot_domain') || '',
                finding_type: gr.getValue('x_gov_copilot_finding_type') || '',
                severity: gr.getValue('x_gov_copilot_severity') || '',
                affected_table: gr.getValue('x_gov_copilot_affected_table') || '',
                affected_record_name: gr.getValue('x_gov_copilot_affected_record') || '',
                affected_count: gr.getValue('x_gov_copilot_affected_count') || 0
            });
        }

        if (findings.length >= 500) {
            gs.warn('GovCopilotAIEngine: findings capped at 500 — some findings will not have AI recommendations');
        }

        if (findings.length === 0) {
            gs.info('GovCopilotAIEngine: No findings found for scan run ' + scanRunSysId);
            return;
        }

        // Split into batches of AI_BATCH_SIZE
        var batches = [];
        for (var i = 0; i < findings.length; i += AI_BATCH_SIZE) {
            var batch = [];
            for (var j = i; j < findings.length && j < i + AI_BATCH_SIZE; j++) {
                batch.push(findings[j]);
            }
            batches.push(batch);
        }

        gs.info('GovCopilotAIEngine: Processing ' + findings.length + ' findings in ' + batches.length + ' batch(es) for scan ' + scanRunSysId);

        // Process each batch
        for (var b = 0; b < batches.length; b++) {
            var currentBatch = batches[b];
            var payload = this._buildRequestPayload(currentBatch, model);

            try {
                var recommendations = this._callClaudeAPI(payload);

                // Match recommendations to findings by finding_id
                var recMap = {};
                for (var r = 0; r < recommendations.length; r++) {
                    var rec = recommendations[r];
                    if (rec && rec.finding_id) {
                        recMap[rec.finding_id] = rec;
                    }
                }

                for (var f = 0; f < currentBatch.length; f++) {
                    var finding = currentBatch[f];
                    var recData = recMap[finding.finding_id];
                    if (recData) {
                        this._storeRecommendation(finding.sys_id, recData, model);
                    } else {
                        gs.warn('GovCopilotAIEngine: No recommendation returned for finding ' + finding.sys_id + '. Applying fallback.');
                        this._applyFallback(finding.sys_id, 'No recommendation returned by Claude for this finding');
                    }
                }

            } catch (e) {
                gs.warn('GovCopilotAIEngine: Batch ' + (b + 1) + ' failed: ' + e.message + '. Applying fallback for ' + currentBatch.length + ' finding(s).');
                for (var ff = 0; ff < currentBatch.length; ff++) {
                    this._applyFallback(currentBatch[ff].sys_id, 'Claude API call failed: ' + e.message);
                }
            }
        }
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _buildRequestPayload
    // Constructs the Claude API request JSON string for a batch of findings.
    // Only metadata is included — no PII, no field values. (AC-N06)
    // ---------------------------------------------------------------------------
    _buildRequestPayload: function(batch, model) {
        // Build the findings metadata array (metadata only, no PII per AC-N06)
        var platformVersion = gs.getProperty('glide.buildtag', 'unknown');
        var findingsForPrompt = [];
        for (var i = 0; i < batch.length; i++) {
            var f = batch[i];
            findingsForPrompt.push({
                finding_id: f.finding_id,
                domain: f.domain,
                finding_type: f.finding_type,
                severity: f.severity,
                affected_table: f.affected_table,
                affected_record_name: f.affected_record_name,
                affected_count: f.affected_count,
                platform_version: platformVersion
            });
        }

        var findingsJSON = JSON.stringify(findingsForPrompt);

        var promptText = 'You are a ServiceNow platform health expert. For each finding below, provide a recommendation in the exact JSON format specified. Respond ONLY with a valid JSON array, no additional text, no markdown.\n\n'
            + 'Findings: ' + findingsJSON + '\n\n'
            + 'Respond with a JSON array where each element has EXACTLY these fields:\n'
            + '[{"finding_id":"<same finding_id from input>","severity_confirmed":"critical|high|medium|low","business_impact":"<string>","technical_impact":"<string>","remediation_steps":"<string>","estimated_effort":"hours|days|weeks","expected_benefit":"<string>"}]';

        var payload = {
            model: model,
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: promptText
                }
            ]
        };

        return JSON.stringify(payload);
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _callClaudeAPI
    // Sends the payload to the Claude API via the pre-configured REST message.
    // Retries up to 3 times on HTTP 429 or 5xx errors. (AC-F10)
    // Returns a parsed JSON array of recommendation objects.
    // ---------------------------------------------------------------------------
    _callClaudeAPI: function(payload) {
        var MAX_RETRIES = 3;
        var apiKey = gs.getProperty('x_gov_copilot.ai.api_key', '');
        var lastError = null;

        for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                var rm = new sn_ws.RESTMessageV2('GovCopilotClaudeAPI', 'sendFindings');
                rm.setRequestHeader('x-api-key', apiKey);
                rm.setRequestHeader('anthropic-version', '2023-06-01');
                rm.setRequestHeader('content-type', 'application/json');
                rm.setRequestBody(payload);

                var response = rm.execute();
                var statusCode = response.getStatusCode();

                if (statusCode === 200) {
                    var body = response.getBody();
                    var parsed = JSON.parse(body);

                    // Claude API returns: { content: [{ type: 'text', text: '...' }] }
                    if (parsed && parsed.content && parsed.content.length > 0) {
                        var text = parsed.content[0].text;
                        // Parse the JSON array from Claude's text response
                        var recommendations = JSON.parse(text);
                        if (!Array.isArray(recommendations)) {
                            throw new Error('Claude response content is not a JSON array: ' + text.substring(0, 200));
                        }
                        return recommendations;
                    }
                    throw new Error('Unexpected Claude API response structure: ' + body.substring(0, 200));
                }

                // Retry on rate limit or server error
                if (statusCode === 429 || statusCode >= 500) {
                    lastError = new Error('Claude API returned HTTP ' + statusCode + ' on attempt ' + attempt);
                    gs.warn('GovCopilotAIEngine: HTTP ' + statusCode + ' on attempt ' + attempt + ' of ' + MAX_RETRIES + '. ' + (attempt < MAX_RETRIES ? 'Retrying...' : 'No more retries.'));
                    // Continue to next attempt
                } else {
                    // Non-retryable error
                    throw new Error('Claude API returned non-retryable HTTP ' + statusCode + ': ' + response.getBody().substring(0, 200));
                }

            } catch (e) {
                // Re-throw non-retryable errors immediately
                if (e.message && e.message.indexOf('non-retryable') !== -1) {
                    throw e;
                }
                lastError = e;
                gs.warn('GovCopilotAIEngine: Attempt ' + attempt + ' threw exception: ' + e.message);
            }
        }

        // All retries exhausted
        throw lastError || new Error('Claude API call failed after ' + MAX_RETRIES + ' attempts');
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _storeRecommendation
    // Creates an x_gov_copilot_recommendation record linked to the finding.
    // Also updates the finding's x_gov_copilot_ai_recommendation back-link.
    // ---------------------------------------------------------------------------
    _storeRecommendation: function(findingSysId, recData, model) {
        var now = new GlideDateTime();

        var rec = new GlideRecord('x_gov_copilot_recommendation');
        rec.initialize();
        rec.setValue('x_gov_copilot_finding', findingSysId);
        rec.setValue('x_gov_copilot_severity_confirmed', recData.severity_confirmed || '');
        rec.setValue('x_gov_copilot_business_impact', recData.business_impact || '');
        rec.setValue('x_gov_copilot_technical_impact', recData.technical_impact || '');
        rec.setValue('x_gov_copilot_remediation_steps', recData.remediation_steps || '');
        rec.setValue('x_gov_copilot_estimated_effort', recData.estimated_effort || 'days');
        rec.setValue('x_gov_copilot_expected_benefit', recData.expected_benefit || '');
        rec.setValue('x_gov_copilot_ai_model_used', model || gs.getProperty('x_gov_copilot.ai.model', 'claude-haiku-4-5'));
        rec.setValue('x_gov_copilot_generated_at', now);
        rec.setValue('x_gov_copilot_ai_status', 'generated');
        var recSysId = rec.insert();

        if (recSysId) {
            this._updateFindingBackLink(findingSysId, recSysId);
        }

        return recSysId;
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _applyFallback
    // Creates an x_gov_copilot_recommendation record with static fallback text.
    // Sets ai_status = 'unavailable'. Also updates the finding's back-link.
    // Fallback text template (per spec):
    //   business_impact: "AI recommendation currently unavailable. Manual review required."
    //   technical_impact: "Unable to assess technical impact automatically at this time."
    //   remediation_steps: "1. Review this finding manually.\n2. Consult ServiceNow documentation.\n3. Engage platform team."
    //   estimated_effort: "days"
    //   expected_benefit: "Improved platform health upon remediation."
    // ---------------------------------------------------------------------------
    _applyFallback: function(findingSysId, reason) {
        var now = new GlideDateTime();

        var rec = new GlideRecord('x_gov_copilot_recommendation');
        rec.initialize();
        rec.setValue('x_gov_copilot_finding', findingSysId);
        rec.setValue('x_gov_copilot_severity_confirmed', '');
        rec.setValue('x_gov_copilot_business_impact', 'AI recommendation currently unavailable. Manual review required.');
        rec.setValue('x_gov_copilot_technical_impact', 'Unable to assess technical impact automatically at this time.');
        rec.setValue('x_gov_copilot_remediation_steps', '1. Review this finding manually.\n2. Consult ServiceNow documentation.\n3. Engage platform team.');
        rec.setValue('x_gov_copilot_estimated_effort', 'days');
        rec.setValue('x_gov_copilot_expected_benefit', 'Improved platform health upon remediation.');
        rec.setValue('x_gov_copilot_ai_model_used', '');
        rec.setValue('x_gov_copilot_generated_at', now);
        rec.setValue('x_gov_copilot_ai_status', 'unavailable');
        var recSysId = rec.insert();

        if (recSysId) {
            this._updateFindingBackLink(findingSysId, recSysId);
        }

        gs.warn('GovCopilotAIEngine: Fallback applied for finding ' + findingSysId + '. Reason: ' + (reason || 'unspecified'));
        return recSysId;
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _updateFindingBackLink
    // Updates the x_gov_copilot_ai_recommendation field on a finding record.
    // Shared by _storeRecommendation and _applyFallback to avoid duplication.
    // ---------------------------------------------------------------------------
    _updateFindingBackLink: function(findingSysId, recSysId) {
        var finding = new GlideRecord('x_gov_copilot_finding');
        if (finding.get(findingSysId)) {
            finding.setValue('x_gov_copilot_ai_recommendation', recSysId);
            finding.update();
        }
    },

    // ---------------------------------------------------------------------------
    // PRIVATE: _applyFallbackForScan
    // Convenience method to apply fallback for ALL findings in a scan run.
    // Used when API key is missing or a scan-level failure occurs.
    // ---------------------------------------------------------------------------
    _applyFallbackForScan: function(scanRunSysId, reason) {
        var gr = new GlideRecord('x_gov_copilot_finding');
        gr.addQuery('x_gov_copilot_scan_run', scanRunSysId);
        gr.query();
        while (gr.next()) {
            this._applyFallback(gr.getUniqueValue(), reason);
        }
    },

    type: 'GovCopilotAIEngine'
};
