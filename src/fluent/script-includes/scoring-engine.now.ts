import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotScoringEngine = ScriptInclude({
  $id: 'script_include_gov_copilot_scoring_engine',
  name: 'GovCopilotScoringEngine',
  apiName: 'x_gov_copilot.GovCopilotScoringEngine',
  description: 'Calculates domain and overall health scores for the Platform Governance & Health Copilot',
  clientCallable: false,
  script: Now.include('./scoring-engine.server.js'),
})
