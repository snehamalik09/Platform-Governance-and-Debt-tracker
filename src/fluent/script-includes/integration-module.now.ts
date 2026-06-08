import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotIntegrationModule = ScriptInclude({
  $id: 'script_include_gov_copilot_integration_module',
  name: 'GovCopilotIntegrationModule',
  apiName: 'x_gov_copilot.GovCopilotIntegrationModule',
  description: 'Detects MID Server issues, unused REST messages, and integration account risks for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./integration-module.server.js'),
})
