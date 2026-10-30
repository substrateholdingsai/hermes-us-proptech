import type { Env } from '../../types/env';
import type { TenantContext } from '../hermesAgent';
import type { SecValidationResult } from './types';
import { searchEdgar } from './edgar';
import { searchFinra } from './finra';
import { logger } from '../../lib/logger';

export function classifyInvestorType(formADVData: { regulatoryAumDollars: number } | null, hasSecFormD: boolean, finraRecord: { isAccreditedByLicense: boolean } | null): 'unknown' | 'accredited' | 'qualified_purchaser' {
  if (formADVData && formADVData.regulatoryAumDollars > 5_000_000) return 'qualified_purchaser';
  if (hasSecFormD || (finraRecord && finraRecord.isAccreditedByLicense)) return 'accredited';
  return 'unknown';
}

export async function validateSecInvestor(
  ctx: TenantContext,
  params: { subjectName?: string; entityName?: string; customPrompt?: string }
): Promise<SecValidationResult> {
  const subjectName = params.subjectName || params.entityName || 'Unknown';
  const entityName = params.entityName;

  let formDFilings: SecValidationResult['formDFilings'] = [];
  let formADVData: SecValidationResult['formADVData'] = null;

  if (entityName) {
    const edgar = await searchEdgar(entityName);
    formDFilings = edgar.formD;
    formADVData = edgar.formADV;
  } else if (subjectName) {
    const edgar = await searchEdgar(subjectName);
    formDFilings = edgar.formD;
    formADVData = edgar.formADV;
  }

  let finraRecord: SecValidationResult['finraRecord'] = null;
  if (params.subjectName) {
    finraRecord = await searchFinra(ctx.env, params.subjectName);
  }

  const hasSecFormD = formDFilings.length > 0;
  const hasSecFormADV = formADVData !== null;

  let investorType: SecValidationResult['investorType'] = 'unknown';
  investorType = classifyInvestorType(formADVData, hasSecFormD, finraRecord);

  let accreditationConfidence = 0.3;
  if (investorType === 'qualified_purchaser') accreditationConfidence = 0.95;
  else if (investorType === 'accredited') accreditationConfidence = 0.85;

  let equityScore = 50;
  if (hasSecFormD) equityScore += 20;
  if (hasSecFormADV) equityScore += 20;
  if (finraRecord?.isAccreditedByLicense) equityScore += 15;
  if (finraRecord?.hasDisciplinaryHistory) equityScore -= 30;
  equityScore = Math.max(0, Math.min(100, equityScore));

  let verdictSummary = '';
  if (ctx.env.AI) {
    try {
      const model = ctx.env.AI_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
      const prompt = `You are a US securities due-diligence analyst. Subject: ${subjectName}. Entity: ${entityName || 'N/A'}. FormD: ${hasSecFormD}, FormADV: ${hasSecFormADV}, FINRA accredited: ${finraRecord?.isAccreditedByLicense}, disciplinary: ${finraRecord?.hasDisciplinaryHistory}. Investor type: ${investorType}. Write a 2-3 sentence executive summary and suggest equityScore (0-100). Return JSON { "verdictSummary": "...", "equityScore": number }.`;
      const res = (await ctx.env.AI.run(model, { messages: [{ role: 'user', content: prompt }], max_tokens: 300 })) as { response?: string };
      const text = res?.response || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]) as { verdictSummary?: string; equityScore?: number };
        if (data.verdictSummary) verdictSummary = data.verdictSummary;
        if (typeof data.equityScore === 'number') equityScore = Math.max(0, Math.min(100, data.equityScore));
      }
    } catch (err) {
      logger.warn('AI verdict failed:', { error: String(err) });
    }
  }
  if (!verdictSummary) {
    verdictSummary = `${subjectName} classified as ${investorType} based on SEC/FINRA signals.`;
  }

  return {
    subjectName,
    entityName,
    investorType,
    hasSecFormD,
    hasSecFormADV,
    formDFilings,
    formADVData,
    finraRecord,
    accreditationConfidence,
    equityScore,
    verdictSummary,
  };
}

export const classifyInvestor = classifyInvestorType;
