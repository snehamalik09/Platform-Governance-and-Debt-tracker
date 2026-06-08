import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotSecurityModule = ScriptInclude({
  $id: 'script_include_gov_copilot_security_module',
  name: 'GovCopilotSecurityModule',
  apiName: 'x_gov_copilot.GovCopilotSecurityModule',
  description: 'Detects security misconfigurations, dormant accounts, and credential risks for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./security-module.server.js'),
})
