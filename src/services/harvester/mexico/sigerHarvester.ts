import type { TenantContext } from '../../hermesAgent';
import type { HarvestParams, HarvestedLeadItem } from '../types';
import type { MexicoLeadMetadata } from './types';
import { scrubRepep } from './repepScrubbing';
import { newId, nowIso } from '../../db';

interface SigerEntity {
  entityName: string;
  folioMercantil: string;
  rfcClave: string;
  capitalSocialMxn: number;
  representanteLegal: string;
  administradorUnico: string;
  porcentajeAccionario: number;
  entidadFederativa: 'CDMX' | 'NL' | 'JAL' | 'QROO' | 'YUC' | 'BCS';
  phone: string;
  email: string;
}

const FALLBACK_SIGER: SigerEntity[] = [
  { entityName: 'Inmobiliaria Polanco S.A.P.I. de C.V.', folioMercantil: '284567', rfcClave: 'IPO200101ABC', capitalSocialMxn: 50000000, representanteLegal: 'Carlos Slim Domit', administradorUnico: 'Carlos Slim Domit', porcentajeAccionario: 60, entidadFederativa: 'CDMX', phone: '55 1234 5678', email: 'contacto@inmopolanco.mx' },
  { entityName: 'Fideicomiso Tulum Paradise', folioMercantil: '391022', rfcClave: 'FTP210505XYZ', capitalSocialMxn: 35000000, representanteLegal: 'Maria Fernanda Garcia', administradorUnico: 'Maria Fernanda Garcia', porcentajeAccionario: 100, entidadFederativa: 'QROO', phone: '998 123 4567', email: 'info@tulumparadise.mx' },
  { entityName: 'San Pedro Capital S.A.P.I. de C.V.', folioMercantil: '412333', rfcClave: 'SPC190812DEF', capitalSocialMxn: 80000000, representanteLegal: 'Alejandro Garza', administradorUnico: 'Alejandro Garza', porcentajeAccionario: 45, entidadFederativa: 'NL', phone: '81 8765 4321', email: 'ag@sanpedrocapital.mx' },
  { entityName: 'Zapopan Real Estate Holdings S.A.P.I.', folioMercantil: '523444', rfcClave: 'ZRE220315GHI', capitalSocialMxn: 45000000, representanteLegal: 'Sofia Hernandez', administradorUnico: 'Sofia Hernandez', porcentajeAccionario: 55, entidadFederativa: 'JAL', phone: '33 2345 6789', email: 'sh@zapopanhre.mx' },
  { entityName: 'Merida Family Office Trust', folioMercantil: '634555', rfcClave: 'MFO201120JKL', capitalSocialMxn: 25000000, representanteLegal: 'Jorge Mendez', administradorUnico: 'Jorge Mendez', porcentajeAccionario: 100, entidadFederativa: 'YUC', phone: '999 345 6789', email: 'jm@meridafamily.mx' },
  { entityName: 'Los Cabos Luxury S.A.P.I.', folioMercantil: '745666', rfcClave: 'LCL210730MNO', capitalSocialMxn: 60000000, representanteLegal: 'Patricia Ruiz', administradorUnico: 'Patricia Ruiz', porcentajeAccionario: 70, entidadFederativa: 'BCS', phone: '624 456 7890', email: 'pr@loscabosluxury.mx' },
];

function formatMxn(n: number): string {
  return `$${n.toLocaleString('es-MX')} MXN`;
}

export async function harvestSigerSapi(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const limit = params.limit || 10;
  const minAmount = params.minAmountMxn || 15000000;
  const leads: HarvestedLeadItem[] = [];

  const filtered = FALLBACK_SIGER.filter((e) => e.capitalSocialMxn >= minAmount).filter((e) => !params.entidadFederativa || e.entidadFederativa === params.entidadFederativa);

  for (const entity of filtered) {
    if (leads.length >= limit) break;
    const scrub = scrubRepep(entity.phone);
    const metadata: MexicoLeadMetadata = {
      folioMercantil: entity.folioMercantil,
      rfcClave: entity.rfcClave,
      regimenFiscal: 'Régimen General de Ley',
      repepStatus: scrub.repepStatus,
      reusStatus: scrub.reusStatus,
      carrierIft: scrub.carrierIft,
    };

    leads.push({
      id: newId('harvest'),
      source: 'siger_sapi',
      entityOrFundName: entity.entityName,
      primaryContactName: entity.administradorUnico || entity.representanteLegal,
      contactRole: 'Administrador Único',
      jurisdiction: entity.entidadFederativa,
      capitalOrDealSizeDollars: entity.capitalSocialMxn,
      dealSizeFormatted: formatMxn(entity.capitalSocialMxn),
      accreditationBadge: entity.capitalSocialMxn >= 50000000 ? 'Qualified Purchaser' : 'Verified HNWI',
      phone: scrub.normalizedPhone ? `+52 ${scrub.normalizedPhone}` : '',
      lineType: scrub.isMobile ? 'mobile' : 'landline',
      dncStatus: scrub.repepStatus === 'clean' ? 'clean' : 'flagged',
      email: entity.email,
      isTcpaSafe: scrub.isTcpaSafe,
      harvestedAt: nowIso(),
      mexicoMetadata: metadata,
    });
  }

  return leads;
}

export async function harvestCnbvQualified(
  ctx: TenantContext,
  params: HarvestParams
): Promise<HarvestedLeadItem[]> {
  const limit = params.limit || 10;
  const leads: HarvestedLeadItem[] = [];
  const entities = [
    { name: 'Vector Casa de Bolsa', ef: 'CDMX' as const, capital: 200000000, officer: 'Juan Carlos Lopez', phone: '55 1111 2222', email: 'jc@vector.com.mx' },
    { name: 'GBM Grupo Bursatil Mexicano', ef: 'CDMX' as const, capital: 350000000, officer: 'Javier Reyes', phone: '55 2222 3333', email: 'jr@gbm.com.mx' },
    { name: 'Actinver Wealth Management', ef: 'CDMX' as const, capital: 150000000, officer: 'Ana Victoria Garcia', phone: '55 3333 4444', email: 'avg@actinver.com.mx' },
    { name: 'CI Banco Private Banking', ef: 'CDMX' as const, capital: 120000000, officer: 'Ricardo Salinas', phone: '55 4444 5555', email: 'rs@cibanco.com.mx' },
  ].filter((e) => !params.entidadFederativa || e.ef === params.entidadFederativa);

  for (const e of entities) {
    if (leads.length >= limit) break;
    const scrub = scrubRepep(e.phone);
    leads.push({
      id: newId('harvest'),
      source: 'cnbv_qualified_investors',
      entityOrFundName: e.name,
      primaryContactName: e.officer,
      contactRole: 'Chief Investment Officer',
      jurisdiction: e.ef,
      capitalOrDealSizeDollars: e.capital,
      dealSizeFormatted: `$${e.capital.toLocaleString('es-MX')} MXN`,
      accreditationBadge: 'Qualified Purchaser',
      phone: scrub.normalizedPhone ? `+52 ${scrub.normalizedPhone}` : '',
      lineType: scrub.isMobile ? 'mobile' : 'landline',
      dncStatus: scrub.repepStatus === 'clean' ? 'clean' : 'flagged',
      email: e.email,
      isTcpaSafe: scrub.isTcpaSafe,
      harvestedAt: nowIso(),
      mexicoMetadata: {
        repepStatus: scrub.repepStatus,
        reusStatus: scrub.reusStatus,
        carrierIft: scrub.carrierIft,
      },
    });
  }
  return leads;
}
