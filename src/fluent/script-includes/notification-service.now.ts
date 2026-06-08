import { ScriptInclude } from '@servicenow/sdk/core'

export const govCopilotNotificationService = ScriptInclude({
  $id: 'script_include_gov_copilot_notification_service',
  name: 'GovCopilotNotificationService',
  apiName: 'x_gov_copilot.GovCopilotNotificationService',
  description: 'Sends post-scan email notifications with health summary',
  clientCallable: false,
  script: Now.include('./notification-service.server.js'),
})
