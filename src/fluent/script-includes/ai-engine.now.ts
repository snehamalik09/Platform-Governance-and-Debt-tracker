import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotAIEngine = ScriptInclude({
  $id: 'script_include_gov_copilot_ai_engine',
  name: 'GovCopilotAIEngine',
  apiName: 'x_gov_copilot.GovCopilotAIEngine',
  description: 'Generates AI-powered recommendations for findings using the Claude API for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./ai-engine.server.js'),
})
