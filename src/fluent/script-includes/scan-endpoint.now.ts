import { ScriptInclude } from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — GlideAjax Scan Endpoint
// Client-callable Script Include used by the Service Portal widget to
// trigger an on-demand scan via GlideAjax (AbstractAjaxProcessor).
// clientCallable: true is required for browser-side GlideAjax calls.
// -----------------------------------------------------------------------
export const govCopilotScanEndpoint = ScriptInclude({
  $id: 'script_include_gov_copilot_scan_endpoint',
  name: 'GovCopilotScanEndpoint',
  apiName: 'x_gov_copilot.GovCopilotScanEndpoint',
  description: 'GlideAjax endpoint for triggering on-demand scans from Service Portal',
  clientCallable: true,
  accessibleFrom: 'public',
  script: Now.include('./scan-endpoint.server.js'),
})
