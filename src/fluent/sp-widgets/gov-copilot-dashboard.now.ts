import { SPWidget } from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — Executive Dashboard SP Widget
// AC-F11 Health Score Gauge, AC-F12 Domain Scorecards, AC-F13 Findings,
// AC-F14 Trend Charts, AC-F15 Cost Optimisation Panel, AC-N03 notification.
// -----------------------------------------------------------------------
export const govCopilotDashboardWidget = SPWidget({
  $id: 'sp_widget_gov_copilot_dashboard',
  id: 'gov_copilot_dashboard',
  name: 'GovCopilot Dashboard',
  description: 'Platform Governance & Health Copilot executive dashboard showing health scores, findings, trends, and cost optimisation opportunities.',
  category: 'custom',
  serverScript: Now.include('./gov-copilot-dashboard.server.js'),
  clientScript: Now.include('./gov-copilot-dashboard.client.js'),
  htmlTemplate: Now.include('./gov-copilot-dashboard.html'),
  customCss: Now.include('./gov-copilot-dashboard.scss'),
})
