// Platform Governance & Health Copilot — Dashboard Widget Client Script
// AngularJS controller — controllerAs 'c'.
// AC-F11 Health Gauge, AC-F12 Domain Scorecards, AC-F13 Findings Panel,
// AC-F14 Trend Charts, AC-F15 Cost Optimisation.

api.controller = function($timeout, spUtil) {
    var c = this;

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------
    c.scanning = false;
    c.scanMessage = null;
    c.activeDomainFilter = null;
    c.filterDomain = '';
    c.filterSeverity = '';
    c.filterStatus = '';
    c.expandedFinding = null;

    // -----------------------------------------------------------------------
    // Colour helpers
    // -----------------------------------------------------------------------
    c.scoreColour = function(score) {
        if (score >= 80) { return '#28a745'; }
        if (score >= 60) { return '#ffc107'; }
        if (score >= 40) { return '#fd7e14'; }
        return '#dc3545';
    };

    c.scoreBadgeClass = function(score) {
        if (score >= 80) { return 'badge-success'; }
        if (score >= 60) { return 'badge-warning'; }
        if (score >= 40) { return 'badge-orange'; }
        return 'badge-danger';
    };

    c.severityBadgeClass = function(severity) {
        var map = {
            'critical': 'badge-danger',
            'high': 'badge-warning',
            'medium': 'badge-info',
            'low': 'badge-default'
        };
        return map[severity] || 'badge-default';
    };

    c.trendArrow = function(current, previous) {
        if (typeof previous !== 'number' || previous === 0) { return ''; }
        if (current > previous) { return '↑'; }
        if (current < previous) { return '↓'; }
        return '→';
    };

    c.trendClass = function(current, previous) {
        if (typeof previous !== 'number' || previous === 0) { return ''; }
        if (current > previous) { return 'trend-up'; }
        if (current < previous) { return 'trend-down'; }
        return '';
    };

    c.domainTrendArrow = function(ds) {
        if (!ds) { return ''; }
        return c.trendArrow(ds.score, ds.previous_score);
    };

    c.domainTrendClass = function(ds) {
        if (!ds) { return ''; }
        return c.trendClass(ds.score, ds.previous_score);
    };

    // -----------------------------------------------------------------------
    // Domain filter (AC-F12 click-through)
    // -----------------------------------------------------------------------
    c.filterByDomain = function(domain) {
        if (c.filterDomain === domain) {
            c.filterDomain = '';
            c.activeDomainFilter = null;
        } else {
            c.filterDomain = domain;
            c.activeDomainFilter = domain;
        }
    };

    // -----------------------------------------------------------------------
    // Findings panel helpers (AC-F13)
    // -----------------------------------------------------------------------
    c.filteredFindings = function() {
        if (!c.data || !c.data.findings) { return []; }
        return c.data.findings.filter(function(f) {
            var domainMatch = !c.filterDomain || f.domain === c.filterDomain;
            var sevMatch = !c.filterSeverity || f.severity === c.filterSeverity;
            var statusMatch = !c.filterStatus || f.remediation_status === c.filterStatus;
            return domainMatch && sevMatch && statusMatch;
        });
    };

    c.toggleFinding = function(finding) {
        c.expandedFinding = (c.expandedFinding === finding.sys_id) ? null : finding.sys_id;
    };

    c.isExpanded = function(finding) {
        return c.expandedFinding === finding.sys_id;
    };

    c.updateFindingStatus = function(finding) {
        spUtil.update(finding);
    };

    // -----------------------------------------------------------------------
    // Severity tile counts from latest scan
    // -----------------------------------------------------------------------
    c.severityCount = function(severity) {
        if (!c.data || !c.data.latestScan) { return 0; }
        var map = {
            'critical': c.data.latestScan.critical_count,
            'high': c.data.latestScan.high_count,
            'medium': c.data.latestScan.medium_count,
            'low': c.data.latestScan.low_count
        };
        return map[severity] || 0;
    };

    // -----------------------------------------------------------------------
    // Run Scan Now (GlideAjax) — sysadmin only
    // -----------------------------------------------------------------------
    c.runScan = function() {
        c.scanning = true;
        c.scanMessage = null;
        var ga = new GlideAjax('GovCopilotScanEndpoint');
        ga.addParam('sysparm_name', 'triggerScan');
        ga.getXML(function(response) {
            c.scanning = false;
            var items = response.responseXML.documentElement.getElementsByTagName('item');
            if (!items || items.length === 0) {
                c.$applyAsync(function() {
                    c.scanMessage = { type: 'error', text: 'No response from server.' };
                });
                return;
            }
            var answer = items[0];
            var error = answer.getAttribute('error');
            if (error) {
                c.$applyAsync(function() {
                    c.scanMessage = { type: 'error', text: error };
                });
            } else {
                c.$applyAsync(function() {
                    c.scanMessage = { type: 'success', text: 'Scan started. Refresh the page after a few minutes to see updated results.' };
                });
            }
        });
    };

    // -----------------------------------------------------------------------
    // Chart.js initialisation — must run after DOM render
    // -----------------------------------------------------------------------
    c.$onInit = function() {
        if (!c.data || !c.data.latestScan) { return; }

        $timeout(function() {
            // Health Gauge (Doughnut) — AC-F11
            var healthCanvas = document.getElementById('gov-copilot-health-gauge');
            if (healthCanvas) {
                var score = c.data.latestScan.overall_health_score;
                var gaugeColour = c.scoreColour(score);
                /* global Chart */
                new Chart(healthCanvas, {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [score, 100 - score],
                            backgroundColor: [gaugeColour, '#e9ecef'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        cutoutPercentage: 70,
                        tooltips: { enabled: false },
                        legend: { display: false },
                        animation: { duration: 800 }
                    }
                });
            }

            // Trend Line Chart — AC-F14
            var trendCanvas = document.getElementById('gov-copilot-trend-line');
            if (trendCanvas && c.data.trendData && c.data.trendData.length > 0) {
                var trendLabels = c.data.trendData.map(function(s) { return s.name || s.started_at; });
                var trendScores = c.data.trendData.map(function(s) { return s.overall_health_score; });

                new Chart(trendCanvas, {
                    type: 'line',
                    data: {
                        labels: trendLabels,
                        datasets: [{
                            label: 'Health Score',
                            data: trendScores,
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0,123,255,0.1)',
                            pointBackgroundColor: '#007bff',
                            fill: true,
                            tension: 0.3
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            yAxes: [{ ticks: { min: 0, max: 100 } }]
                        },
                        legend: { display: true, position: 'top' }
                    }
                });
            }

            // Stacked Bar Chart (severity per scan) — AC-F14
            var barCanvas = document.getElementById('gov-copilot-trend-bar');
            if (barCanvas && c.data.trendData && c.data.trendData.length > 0) {
                var barLabels = c.data.trendData.map(function(s) { return s.name || s.started_at; });

                new Chart(barCanvas, {
                    type: 'bar',
                    data: {
                        labels: barLabels,
                        datasets: [
                            {
                                label: 'Critical',
                                data: c.data.trendData.map(function(s) { return s.critical_count; }),
                                backgroundColor: '#dc3545'
                            },
                            {
                                label: 'High',
                                data: c.data.trendData.map(function(s) { return s.high_count; }),
                                backgroundColor: '#ffc107'
                            },
                            {
                                label: 'Medium',
                                data: c.data.trendData.map(function(s) { return s.medium_count; }),
                                backgroundColor: '#17a2b8'
                            },
                            {
                                label: 'Low',
                                data: c.data.trendData.map(function(s) { return s.low_count; }),
                                backgroundColor: '#6c757d'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            xAxes: [{ stacked: true }],
                            yAxes: [{ stacked: true, ticks: { beginAtZero: true } }]
                        },
                        legend: { display: true, position: 'top' }
                    }
                });
            }
        }, 0);
    };
};
