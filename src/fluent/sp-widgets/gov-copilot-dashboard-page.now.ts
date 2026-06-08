import { SPPage } from '@servicenow/sdk/core'
import { govCopilotDashboardWidget } from './gov-copilot-dashboard.now'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — Executive Dashboard SP Page
// Accessible at ?id=gov_copilot_dashboard in any Service Portal.
// AC-F11–AC-F15, AC-N03.
// SPPage uses WithMetadata (no top-level $id) — identity comes from pageId.
// -----------------------------------------------------------------------
export const govCopilotDashboardPage = SPPage({
  pageId: 'gov_copilot_dashboard',
  title: 'Platform Governance Dashboard',
  shortDescription: 'Platform Governance & Health Copilot executive dashboard',
  category: 'custom',
  containers: [
    {
      $id: 'sp_container_gov_copilot_dashboard',
      width: 'container-fluid',
      order: 100,
      rows: [
        {
          $id: 'sp_row_gov_copilot_dashboard',
          order: 100,
          columns: [
            {
              $id: 'sp_column_gov_copilot_dashboard',
              size: 12,
              order: 100,
              instances: [
                {
                  $id: 'sp_instance_gov_copilot_dashboard',
                  widget: govCopilotDashboardWidget,
                  order: 100,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
