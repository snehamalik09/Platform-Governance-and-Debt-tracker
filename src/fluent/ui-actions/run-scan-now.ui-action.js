// UI Action script — runs server-side when "Run Scan Now" button is clicked.
// Calls GovCopilotScanOrchestrator.runScan() and reports success or failure.
var orchestrator = new GovCopilotScanOrchestrator();
try {
    var result = orchestrator.runScan();
    gs.addInfoMessage('Scan started: ' + result.scanRunSysId + '. The scan is running in the background.');
} catch (e) {
    gs.addErrorMessage('Scan failed to start: ' + (e.message || e));
}
