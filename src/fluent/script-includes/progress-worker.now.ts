import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotProgressWorker = ScriptInclude({
  $id: 'script_include_gov_copilot_progress_worker',
  name: 'GovCopilotProgressWorker',
  apiName: 'x_gov_copilot.GovCopilotProgressWorker',
  description: 'Runs platform governance scan modules sequentially and aggregates results',
  clientCallable: false,
  script: Now.include('./progress-worker.server.js'),
})
