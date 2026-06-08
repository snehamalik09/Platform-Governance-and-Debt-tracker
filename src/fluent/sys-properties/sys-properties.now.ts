import { Property } from '@servicenow/sdk/core'

// -----------------------------------------------------------------------
// Platform Governance & Health Copilot — System Properties
// All 16 properties are scoped under x_gov_copilot.
// Read/write access is restricted to the admin role.
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// Scoring — domain weights (must sum to 100)
// -----------------------------------------------------------------------

export const weightSecurity = Property({
  $id: 'prop_scoring_weight_security',
  name: 'x_gov_copilot.scoring.weight.security',
  type: 'string',
  value: '25',
  description: 'Security domain weight (%)',
  roles: { read: ['admin'], write: ['admin'] },
})

export const weightPerformance = Property({
  $id: 'prop_scoring_weight_performance',
  name: 'x_gov_copilot.scoring.weight.performance',
  type: 'string',
  value: '25',
  description: 'Performance domain weight (%)',
  roles: { read: ['admin'], write: ['admin'] },
})

export const weightCmdb = Property({
  $id: 'prop_scoring_weight_cmdb',
  name: 'x_gov_copilot.scoring.weight.cmdb',
  type: 'string',
  value: '20',
  description: 'CMDB domain weight (%)',
  roles: { read: ['admin'], write: ['admin'] },
})

export const weightIntegration = Property({
  $id: 'prop_scoring_weight_integration',
  name: 'x_gov_copilot.scoring.weight.integration',
  type: 'string',
  value: '15',
  description: 'Integration domain weight (%)',
  roles: { read: ['admin'], write: ['admin'] },
})

export const weightCatalog = Property({
  $id: 'prop_scoring_weight_catalog',
  name: 'x_gov_copilot.scoring.weight.catalog',
  type: 'string',
  value: '15',
  description: 'Catalog domain weight (%)',
  roles: { read: ['admin'], write: ['admin'] },
})

// -----------------------------------------------------------------------
// Scoring — per-severity point deductions
// -----------------------------------------------------------------------

export const deductionCritical = Property({
  $id: 'prop_scoring_deduction_critical',
  name: 'x_gov_copilot.scoring.deduction.critical',
  type: 'string',
  value: '15',
  description: 'Points deducted per Critical finding',
  roles: { read: ['admin'], write: ['admin'] },
})

export const deductionHigh = Property({
  $id: 'prop_scoring_deduction_high',
  name: 'x_gov_copilot.scoring.deduction.high',
  type: 'string',
  value: '8',
  description: 'Points deducted per High finding',
  roles: { read: ['admin'], write: ['admin'] },
})

export const deductionMedium = Property({
  $id: 'prop_scoring_deduction_medium',
  name: 'x_gov_copilot.scoring.deduction.medium',
  type: 'string',
  value: '4',
  description: 'Points deducted per Medium finding',
  roles: { read: ['admin'], write: ['admin'] },
})

export const deductionLow = Property({
  $id: 'prop_scoring_deduction_low',
  name: 'x_gov_copilot.scoring.deduction.low',
  type: 'string',
  value: '1',
  description: 'Points deducted per Low finding',
  roles: { read: ['admin'], write: ['admin'] },
})

// -----------------------------------------------------------------------
// Scoring — health status thresholds
// -----------------------------------------------------------------------

export const thresholdHealthy = Property({
  $id: 'prop_scoring_threshold_healthy',
  name: 'x_gov_copilot.scoring.threshold.healthy',
  type: 'string',
  value: '80',
  description: 'Minimum score for Healthy status (Green)',
  roles: { read: ['admin'], write: ['admin'] },
})

export const thresholdAttention = Property({
  $id: 'prop_scoring_threshold_attention',
  name: 'x_gov_copilot.scoring.threshold.attention',
  type: 'string',
  value: '60',
  description: 'Minimum score for Needs Attention status (Amber)',
  roles: { read: ['admin'], write: ['admin'] },
})

export const thresholdRisk = Property({
  $id: 'prop_scoring_threshold_risk',
  name: 'x_gov_copilot.scoring.threshold.risk',
  type: 'string',
  value: '40',
  description: 'Minimum score for At Risk status (Orange)',
  roles: { read: ['admin'], write: ['admin'] },
})

// -----------------------------------------------------------------------
// AI / Claude integration
// -----------------------------------------------------------------------

export const aiModel = Property({
  $id: 'prop_ai_model',
  name: 'x_gov_copilot.ai.model',
  type: 'string',
  value: 'claude-haiku-4-5',
  description: 'Claude model identifier for AI recommendations',
  roles: { read: ['admin'], write: ['admin'] },
})

export const aiApiKey = Property({
  $id: 'prop_ai_api_key',
  name: 'x_gov_copilot.ai.api_key',
  type: 'password2',
  value: '',
  description: 'Claude API key — encrypted at rest (password2 type)',
  roles: { read: ['admin'], write: ['admin'] },
})

// -----------------------------------------------------------------------
// Notification
// -----------------------------------------------------------------------

export const notificationRecipients = Property({
  $id: 'prop_notification_recipients',
  name: 'x_gov_copilot.notification.recipients',
  type: 'string',
  value: '',
  description: 'Comma-separated list of email addresses for post-scan notifications',
  roles: { read: ['admin'], write: ['admin'] },
})

// -----------------------------------------------------------------------
// Scan engine
// -----------------------------------------------------------------------

export const scanBatchSize = Property({
  $id: 'prop_scan_batch_size',
  name: 'x_gov_copilot.scan.batch_size',
  type: 'string',
  value: '1000',
  description: 'Number of records per GlideRecord pagination batch during scanning',
  roles: { read: ['admin'], write: ['admin'] },
})
