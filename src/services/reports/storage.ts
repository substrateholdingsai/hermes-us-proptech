import type { Env } from '../../types/env';

export async function saveReportPdfToR2(env: Env, tenantId: string, reportId: string, pdfBuffer: Uint8Array): Promise<string> {
  const key = `reports/${tenantId}/${reportId}.pdf`;
  await env.R2.put(key, pdfBuffer, { httpMetadata: { contentType: 'application/pdf' } });
  return key;
}

export async function getReportPdfFromR2(env: Env, tenantId: string, reportId: string): Promise<R2ObjectBody | null> {
  const key = `reports/${tenantId}/${reportId}.pdf`;
  return env.R2.get(key);
}
