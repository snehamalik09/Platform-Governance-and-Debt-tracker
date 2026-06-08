import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotPerformanceModule = ScriptInclude({
  $id: 'script_include_gov_copilot_performance_module',
  name: 'GovCopilotPerformanceModule',
  apiName: 'x_gov_copilot.GovCopilotPerformanceModule',
  description: 'Detects performance anti-patterns in business rules and scheduled jobs for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./performance-module.server.js'),
})
