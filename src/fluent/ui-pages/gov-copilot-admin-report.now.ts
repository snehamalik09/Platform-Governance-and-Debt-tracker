import { Record } from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — Admin Report UI Page
// Accessible at /gov_copilot_admin_report.do
// §7.2, AC-F17
// -----------------------------------------------------------------------
export const govCopilotAdminReport = Record({
  $id: 'ui_page_gov_copilot_admin_report',
  table: 'sys_ui_page',
  data: {
    name: 'gov_copilot_admin_report',
    description: 'Platform Governance & Health Copilot Admin Report',
    category: 'general',
    direct: true,
    html: Now.include('./gov-copilot-admin-report.jelly'),
  },
})
