import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotCatalogModule = ScriptInclude({
  $id: 'script_include_gov_copilot_catalog_module',
  name: 'GovCopilotCatalogModule',
  apiName: 'x_gov_copilot.GovCopilotCatalogModule',
  description: 'Detects catalog item governance issues including unused items, missing approvals, broken workflows, and duplicate entries for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./catalog-module.server.js'),
})
