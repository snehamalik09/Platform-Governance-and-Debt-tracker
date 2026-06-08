import { Record } from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — Run Scan Now UI Action
// Adds a "Run Scan Now" button to the x_gov_copilot_scan_run list view.
// Restricted to sysadmin role (AC-F19).
// -----------------------------------------------------------------------
export const runScanNowAction = Record({
  $id: 'ui_action_run_scan_now',
  table: 'sys_ui_action',
  data: {
    name: 'Run Scan Now',
    table: 'x_gov_copilot_scan_run',
    action_name: 'run_scan_now',
    type: 'list_banner_button',
    list_button: true,
    hint: 'Start a new on-demand platform health scan',
    roles: 'sysadmin',
    condition: "gs.hasRole('sysadmin')",
    script: Now.include('./run-scan-now.ui-action.js'),
  },
})
