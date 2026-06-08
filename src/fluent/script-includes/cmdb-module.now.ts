import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotCMDBModule = ScriptInclude({
  $id: 'script_include_gov_copilot_cmdb_module',
  name: 'GovCopilotCMDBModule',
  apiName: 'x_gov_copilot.GovCopilotCMDBModule',
  description: 'Detects CMDB health issues including duplicate CIs, missing owners, missing support groups, stale records, and unowned production assets for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./cmdb-module.server.js'),
})
