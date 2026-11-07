import type { TenantContext } from '../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from './types';

export async function harvestLuxuryCashBuyers(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  // No authorized automated source implemented; fixed fallback data removed.
  const leads: any = [];
  leads.error = 'source_disabled_no_authorized_access';
  leads.disabled = true;
  return leads;
}
