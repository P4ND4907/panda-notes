const serviceLabels = {
  'Setup Sprint': 'setup-sprint',
  'Developer Handoff Pack': 'developer-handoff',
  'Private Integration': 'private-integration',
  'Not sure yet': 'scope-needed'
};

export function validateIntakePayload(payload) {
  const errors = [];
  const data = normalizeIntakePayload(payload);

  if (!data.privacyConfirm) errors.push('privacy confirmation is required');
  if (!isEmail(data.replyEmail)) errors.push('valid reply email is required');
  if (data.scope.length < 12) errors.push('scope must be at least 12 characters');
  if (data.website) errors.push('spam honeypot was filled');

  return { ok: errors.length === 0, errors, data };
}

export function normalizeIntakePayload(payload = {}) {
  return {
    service: cleanText(payload.service || 'Not sure yet', 80),
    paymentReference: cleanText(payload.paymentReference || '', 160),
    customerName: cleanText(payload.customerName || '', 120),
    replyEmail: cleanText(payload.replyEmail || '', 160),
    projectUrl: cleanText(payload.projectUrl || '', 260),
    deadline: cleanText(payload.deadline || '', 120),
    scope: cleanText(payload.scope || '', 4000),
    privateMaterials: cleanText(payload.privateMaterials || '', 2000),
    outputTarget: cleanText(payload.outputTarget || '', 1200),
    privacyConfirm: Boolean(payload.privacyConfirm),
    source: cleanText(payload.source || 'Panda Notes private intake', 120),
    generatedAt: cleanText(payload.generatedAt || new Date().toISOString(), 80),
    website: cleanText(payload.website || '', 120)
  };
}

export function buildIntakeIssue(data) {
  const intakeId = `panda-intake-${Date.now().toString(36)}`;
  const serviceLabel = serviceLabels[data.service] || 'scope-needed';
  const titleName = data.customerName || data.replyEmail || 'New customer';
  const title = `[Private Intake] ${data.service} - ${titleName}`;
  const labels = ['paid-service', 'private-intake', serviceLabel, 'scope-needed'];
  const body = [
    `<!-- ${intakeId} -->`,
    '# Panda Notes Private Intake',
    '',
    `Intake ID: ${intakeId}`,
    `Generated: ${data.generatedAt}`,
    `Service: ${data.service}`,
    `Customer: ${data.customerName || 'Not provided'}`,
    `Reply email: ${data.replyEmail}`,
    `Payment reference: ${data.paymentReference || 'Not provided'}`,
    `Project URL: ${data.projectUrl || 'Not provided'}`,
    `Delivery window: ${data.deadline || 'Not provided'}`,
    `Privacy confirmation: ${data.privacyConfirm ? 'Confirmed' : 'Not confirmed'}`,
    '',
    '## Scope',
    data.scope || 'Not provided',
    '',
    '## Private Materials Available After Scope Confirmation',
    data.privateMaterials || 'Not provided',
    '',
    '## Tools And Output Target',
    data.outputTarget || 'Not provided',
    '',
    '## Owner Checklist',
    '- Confirm Stripe deposit or invoice status.',
    '- Confirm scope and delivery date.',
    '- Move credentials, exports, or confidential source code only through an agreed private channel.',
    '- Label as `payment-confirmed`, `waiting-on-customer`, `in-progress`, or `delivered` as work moves.'
  ].join('\n');

  return { intakeId, title, body, labels };
}

function cleanText(value, maxLength) {
  return String(value)
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
