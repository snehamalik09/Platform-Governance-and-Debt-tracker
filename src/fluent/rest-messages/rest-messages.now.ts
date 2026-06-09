import { Record } from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — Outbound REST Messages
// Defines the Claude API integration for AI-powered recommendations.
//
// Authentication: The Claude API uses header-based auth (x-api-key).
// authentication_type is set to 'no_authentication' on the parent message;
// the Script Include (GovCopilotAIEngine) injects the API key at runtime
// via RESTMessageV2.setRequestHeader — no key is stored here.
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// Parent REST Message: GovCopilotClaudeAPI
// -----------------------------------------------------------------------
export const claudeApiMessage = Record({
  $id: 'rest_msg_gov_copilot_claude_api',
  table: 'sys_rest_message',
  data: {
    name: 'GovCopilotClaudeAPI',
    rest_endpoint: 'https://api.anthropic.com/v1/messages',
    authentication_type: 'no_authentication',
    description: 'Outbound REST message for Claude API AI recommendations',
  },
})

// -----------------------------------------------------------------------
// HTTP Method: sendFindings (POST)
// The content field below is a reference template only.
// GovCopilotAIEngine overrides it at runtime via rm.setRequestBody(),
// so the stored template has no effect on actual requests.
// -----------------------------------------------------------------------
export const claudeApiSendFindings = Record({
  $id: 'rest_msg_fn_gov_copilot_send_findings',
  table: 'sys_rest_message_fn',
  data: {
    rest_message: 'GovCopilotClaudeAPI',
    function_name: 'sendFindings',
    http_method: 'post',
    rest_endpoint: 'https://api.anthropic.com/v1/messages',
    content:
      '{"model":"${ai_model}","max_tokens":1024,"messages":[{"role":"user","content":"${prompt}"}]}',
  },
})
