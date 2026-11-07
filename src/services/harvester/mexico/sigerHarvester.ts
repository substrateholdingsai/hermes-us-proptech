import type { TenantContext } from '../../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from '../types';

export async function harvestSigerSapi(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const leads: any = [];
  leads.error = 'source_disabled_no_authorized_access';
  leads.disabled = true;
  return leads;
}

export async function harvestCnbvQualified(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const leads: any = [];
  leads.error = 'source_disabled_no_authorized_access';
  leads.disabled = true;
  return leads;
}
