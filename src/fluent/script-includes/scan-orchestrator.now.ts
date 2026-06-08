import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotScanOrchestrator = ScriptInclude({
  $id: 'script_include_gov_copilot_scan_orchestrator',
  name: 'GovCopilotScanOrchestrator',
  apiName: 'x_gov_copilot.GovCopilotScanOrchestrator',
  description: 'Entry point for on-demand platform health scans',
  clientCallable: false,
  script: Now.include('./scan-orchestrator.server.js'),
})
