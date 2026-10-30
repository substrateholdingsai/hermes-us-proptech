import type { Env } from '../../types/env';
import type { TenantContext } from '../hermesAgent';
import type { SkipTraceResult } from './types';
import { validatePhone } from './phone';
import { validateEmail } from './email';
import { searchContacts } from './search';
import { logger } from '../../lib/logger';

export async function executeSkipTrace(
  ctx: TenantContext,
  params: { subjectName: string; propertyAddress?: string; customPrompt?: string }
): Promise<SkipTraceResult> {
  const { subjectName, propertyAddress } = params;

  const contacts = await searchContacts(ctx.env, { subjectName, propertyAddress });

  const phoneResults = await Promise.all(contacts.phones.map((p) => validatePhone(ctx.env, p)));
  const emailResults = await Promise.all(contacts.emails.map((e) => validateEmail(e)));

  const validPhones = phoneResults.filter((p) => p.isValid);
  const validEmails = emailResults.filter((e) => e.isValidSyntax);

  const primaryPhone = validPhones[0] || phoneResults[0] || null;
  const secondaryPhones = (validPhones.length ? validPhones : phoneResults).slice(1);

  const primaryEmail = validEmails[0] || emailResults[0] || null;
  const secondaryEmails = (validEmails.length ? validEmails : emailResults).slice(1);

  let confidence = 0;
  if (primaryPhone && primaryPhone.lineType === 'mobile' && primaryPhone.dncStatus === 'clean') confidence += 0.5;
  if (primaryEmail && primaryEmail.hasMxRecords) confidence += 0.4;
  if (secondaryPhones.length || secondaryEmails.length) confidence += 0.1;
  confidence = Math.max(0, Math.min(1, confidence));
  if (!primaryPhone && !primaryEmail) confidence = 0;

  logger.info('Skip-trace completed', { subjectName, confidence, source: contacts.source });

  return {
    subjectName,
    primaryPhone,
    secondaryPhones,
    primaryEmail,
    secondaryEmails,
    confidenceScore: confidence,
    source: contacts.source,
  };
}
