import {
  Table,
  StringColumn,
  MultiLineTextColumn,
  ReferenceColumn,
  IntegerColumn,
  DateTimeColumn,
  ChoiceColumn,
} from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Shared Constants
// -----------------------------------------------------------------------
const DOMAIN_CHOICES = {
  performance: { label: 'Performance' },
  security: { label: 'Security' },
  integration: { label: 'Integration' },
  catalog: { label: 'Catalog' },
  cmdb: { label: 'CMDB' },
} as const

// -----------------------------------------------------------------------
// Table 1: x_gov_copilot_scan_run
// -----------------------------------------------------------------------
export const x_gov_copilot_scan_run = Table({
  name: 'x_gov_copilot_scan_run',
  label: 'Gov Copilot Scan Run',
  schema: {
    x_gov_copilot_name: StringColumn({
      label: 'Name',
      maxLength: 100,
    }),
    x_gov_copilot_status: ChoiceColumn({
      label: 'Status',
      choices: {
        pending: { label: 'Pending' },
        running: { label: 'Running' },
        completed: { label: 'Completed' },
        partial: { label: 'Partial' },
        failed: { label: 'Failed' },
      },
      default: 'pending',
    }),
    x_gov_copilot_triggered_by: ChoiceColumn({
      label: 'Triggered By',
      choices: {
        manual: { label: 'Manual' },
      },
      default: 'manual',
    }),
    x_gov_copilot_scan_type: ChoiceColumn({
      label: 'Scan Type',
      choices: {
        on_demand: { label: 'On Demand' },
      },
      default: 'on_demand',
    }),
    x_gov_copilot_started_at: DateTimeColumn({
      label: 'Started At',
    }),
    x_gov_copilot_completed_at: DateTimeColumn({
      label: 'Completed At',
    }),
    x_gov_copilot_duration_seconds: IntegerColumn({
      label: 'Duration (seconds)',
    }),
    x_gov_copilot_modules_completed: IntegerColumn({
      label: 'Modules Completed',
      default: 0,
    }),
    x_gov_copilot_modules_failed: IntegerColumn({
      label: 'Modules Failed',
      default: 0,
    }),
    x_gov_copilot_total_findings: IntegerColumn({
      label: 'Total Findings',
      default: 0,
    }),
    x_gov_copilot_critical_count: IntegerColumn({
      label: 'Critical Count',
      default: 0,
    }),
    x_gov_copilot_high_count: IntegerColumn({
      label: 'High Count',
      default: 0,
    }),
    x_gov_copilot_medium_count: IntegerColumn({
      label: 'Medium Count',
      default: 0,
    }),
    x_gov_copilot_low_count: IntegerColumn({
      label: 'Low Count',
      default: 0,
    }),
    x_gov_copilot_overall_health_score: IntegerColumn({
      label: 'Overall Health Score',
    }),
  },
})

// -----------------------------------------------------------------------
// Table 2: x_gov_copilot_recommendation
// Defined before x_gov_copilot_finding to resolve circular reference
// (finding.ai_recommendation -> recommendation, recommendation.finding -> finding)
// -----------------------------------------------------------------------
export const x_gov_copilot_recommendation = Table({
  name: 'x_gov_copilot_recommendation',
  label: 'Gov Copilot Recommendation',
  schema: {
    x_gov_copilot_finding: ReferenceColumn({
      label: 'Finding',
      referenceTable: 'x_gov_copilot_finding',
    }),
    x_gov_copilot_severity_confirmed: ChoiceColumn({
      label: 'Severity Confirmed',
      choices: {
        critical: { label: 'Critical' },
        high: { label: 'High' },
        medium: { label: 'Medium' },
        low: { label: 'Low' },
      },
    }),
    x_gov_copilot_business_impact: MultiLineTextColumn({
      label: 'Business Impact',
    }),
    x_gov_copilot_technical_impact: MultiLineTextColumn({
      label: 'Technical Impact',
    }),
    x_gov_copilot_remediation_steps: MultiLineTextColumn({
      label: 'Remediation Steps',
    }),
    x_gov_copilot_estimated_effort: ChoiceColumn({
      label: 'Estimated Effort',
      choices: {
        hours: { label: 'Hours' },
        days: { label: 'Days' },
        weeks: { label: 'Weeks' },
      },
    }),
    x_gov_copilot_expected_benefit: MultiLineTextColumn({
      label: 'Expected Benefit',
    }),
    x_gov_copilot_ai_model_used: StringColumn({
      label: 'AI Model Used',
      maxLength: 100,
    }),
    x_gov_copilot_generated_at: DateTimeColumn({
      label: 'Generated At',
    }),
    x_gov_copilot_ai_status: ChoiceColumn({
      label: 'AI Status',
      choices: {
        generated: { label: 'Generated' },
        pending: { label: 'Pending' },
        failed: { label: 'Failed' },
        unavailable: { label: 'Unavailable' },
      },
      default: 'pending',
    }),
  },
})

// -----------------------------------------------------------------------
// Table 3: x_gov_copilot_finding
// Defined after x_gov_copilot_recommendation to satisfy the forward reference
// -----------------------------------------------------------------------
export const x_gov_copilot_finding = Table({
  name: 'x_gov_copilot_finding',
  label: 'Gov Copilot Finding',
  schema: {
    x_gov_copilot_scan_run: ReferenceColumn({
      label: 'Scan Run',
      referenceTable: 'x_gov_copilot_scan_run',
    }),
    x_gov_copilot_domain: ChoiceColumn({
      label: 'Domain',
      choices: DOMAIN_CHOICES,
    }),
    x_gov_copilot_finding_type: StringColumn({
      label: 'Finding Type',
      maxLength: 80,
    }),
    x_gov_copilot_title: StringColumn({
      label: 'Title',
      maxLength: 255,
    }),
    x_gov_copilot_description: MultiLineTextColumn({
      label: 'Description',
    }),
    x_gov_copilot_severity: ChoiceColumn({
      label: 'Severity',
      choices: {
        critical: { label: 'Critical' },
        high: { label: 'High' },
        medium: { label: 'Medium' },
        low: { label: 'Low' },
      },
    }),
    x_gov_copilot_affected_table: StringColumn({
      label: 'Affected Table',
      maxLength: 80,
    }),
    x_gov_copilot_affected_record_sys_id: StringColumn({
      label: 'Affected Record Sys ID',
      maxLength: 32,
    }),
    x_gov_copilot_affected_record_name: StringColumn({
      label: 'Affected Record Name',
      maxLength: 255,
    }),
    x_gov_copilot_remediation_status: ChoiceColumn({
      label: 'Remediation Status',
      choices: {
        open: { label: 'Open' },
        in_progress: { label: 'In Progress' },
        resolved: { label: 'Resolved' },
        accepted_risk: { label: 'Accepted Risk' },
      },
      default: 'open',
    }),
    x_gov_copilot_ai_recommendation: ReferenceColumn({
      label: 'AI Recommendation',
      referenceTable: 'x_gov_copilot_recommendation',
    }),
  },
})

// -----------------------------------------------------------------------
// Table 4: x_gov_copilot_domain_score
// -----------------------------------------------------------------------
export const x_gov_copilot_domain_score = Table({
  name: 'x_gov_copilot_domain_score',
  label: 'Gov Copilot Domain Score',
  schema: {
    x_gov_copilot_scan_run: ReferenceColumn({
      label: 'Scan Run',
      referenceTable: 'x_gov_copilot_scan_run',
    }),
    x_gov_copilot_domain: ChoiceColumn({
      label: 'Domain',
      choices: DOMAIN_CHOICES,
    }),
    x_gov_copilot_score: IntegerColumn({
      label: 'Score',
    }),
    x_gov_copilot_previous_score: IntegerColumn({
      label: 'Previous Score',
    }),
    x_gov_copilot_score_delta: IntegerColumn({
      label: 'Score Delta',
    }),
    x_gov_copilot_finding_count: IntegerColumn({
      label: 'Finding Count',
      default: 0,
    }),
  },
})
