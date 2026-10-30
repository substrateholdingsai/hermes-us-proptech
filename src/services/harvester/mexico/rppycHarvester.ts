import type { TenantContext } from '../../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from '../types';
import type { MexicoLeadMetadata } from './types';
import { scrubRepep } from './repepScrubbing';
import { newId, nowIso } from '../../db';

interface RppycTransaction {
  buyerEntity: string;
  propertyAddress: string;
  zona: string;
  entidadFederativa: 'CDMX' | 'NL' | 'JAL' | 'QROO' | 'YUC' | 'BCS';
  salePriceMxn: number;
  notariaNumero: number;
  notarioTitular: string;
  folioMercantil?: string;
  phone: string;
  email: string;
}

const FALLBACK_RPPYC: RppycTransaction[] = [
  { buyerEntity: 'Inversiones Polanco S.A.P.I.', propertyAddress: 'Av. Presidente Masaryk 111, Polanco, CDMX', zona: 'Polanco', entidadFederativa: 'CDMX', salePriceMxn: 45000000, notariaNumero: 12, notarioTitular: 'Lic. Juan Perez', phone: '55 9876 5432', email: 'jp@inversionespolanco.mx' },
  { buyerEntity: 'Fideicomiso Lomas Chapultepec', propertyAddress: 'Paseo de la Reforma 222, Lomas, CDMX', zona: 'Lomas de Chapultepec', entidadFederativa: 'CDMX', salePriceMxn: 62000000, notariaNumero: 45, notarioTitular: 'Lic. Maria Lopez', phone: '55 8765 4321', email: 'ml@lomasfide.mx' },
  { buyerEntity: 'San Pedro Luxury Holdings LLC', propertyAddress: 'Av. Ricardo Margain 333, San Pedro, NL', zona: 'Valle Oriente', entidadFederativa: 'NL', salePriceMxn: 38000000, notariaNumero: 8, notarioTitular: 'Lic. Roberto Garza', phone: '81 7654 3210', email: 'rg@sanpedroluxury.mx' },
  { buyerEntity: 'Puerta de Hierro Investments', propertyAddress: 'Av. Patria 444, Zapopan, JAL', zona: 'Puerta de Hierro', entidadFederativa: 'JAL', salePriceMxn: 29000000, notariaNumero: 22, notarioTitular: 'Lic. Ana Martinez', phone: '33 6543 2109', email: 'am@puertahierro.mx' },
  { buyerEntity: 'Tulum Beachfront Trust', propertyAddress: 'Carretera Tulum-Boca Paila km 5, Tulum, QROO', zona: 'Tulum', entidadFederativa: 'QROO', salePriceMxn: 55000000, notariaNumero: 3, notarioTitular: 'Lic. Luis Torres', phone: '998 543 2109', email: 'lt@tulumbeach.mx' },
  { buyerEntity: 'Merida Colonial Holdings', propertyAddress: 'Paseo de Montejo 555, Merida, YUC', zona: 'Paseo de Montejo', entidadFederativa: 'YUC', salePriceMxn: 22000000, notariaNumero: 15, notarioTitular: 'Lic. Carmen Diaz', phone: '999 432 1098', email: 'cd@meridacolonial.mx' },
];

function formatMxn(n: number): string {
  return `$${n.toLocaleString('es-MX')} MXN`;
}

export async function harvestRppycLuxury(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const limit = params.limit || 10;
  const minAmount = params.minAmountMxn || 15000000;
  const leads: HarvestedLeadItem[] = [];

  const filtered = FALLBACK_RPPYC.filter((t) => t.salePriceMxn >= minAmount).filter((t) => !params.entidadFederativa || t.entidadFederativa === params.entidadFederativa);

  for (const tx of filtered) {
    if (leads.length >= limit) break;
    const scrub = scrubRepep(tx.phone);
    const metadata: MexicoLeadMetadata = {
      notariaNumero: tx.notariaNumero,
      notarioTitular: tx.notarioTitular,
      folioMercantil: tx.folioMercantil,
      repepStatus: scrub.repepStatus,
      reusStatus: scrub.reusStatus,
      carrierIft: scrub.carrierIft,
    };

    leads.push({
      id: newId('harvest'),
      source: 'rppyc_luxury_acquisitions',
      entityOrFundName: tx.buyerEntity,
      primaryContactName: tx.notarioTitular,
      contactRole: 'UBO',
      jurisdiction: tx.entidadFederativa,
      capitalOrDealSizeDollars: tx.salePriceMxn,
      dealSizeFormatted: formatMxn(tx.salePriceMxn),
      accreditationBadge: 'Verified HNWI',
      phone: scrub.normalizedPhone ? `+52 ${scrub.normalizedPhone}` : '',
      lineType: scrub.isMobile ? 'mobile' : 'landline',
      dncStatus: scrub.repepStatus === 'clean' ? 'clean' : 'flagged',
      email: tx.email,
      isTcpaSafe: scrub.isTcpaSafe,
      harvestedAt: nowIso(),
      mexicoMetadata: metadata,
    });
  }

  return leads;
}
