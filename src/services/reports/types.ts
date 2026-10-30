export interface MexicoCorporateSection {
  razonSocial: string;
  tipoSociedad: 'S.A.P.I. de C.V.' | 'S.A. de C.V.' | 'Fideicomiso Inmobiliario' | 'Sociedad Civil';
  folioMercantil: string;
  entidadFederativa: string;
  rfcClave: string;
  regimenFiscal: string;
  administradorUnico: string;
  apoderadoLegal?: string;
  capitalSocialMxnFormatted: string;
}

export interface MexicoPropertySection {
  ubicacion: string;
  folioReal?: string;
  notariaNumero: number;
  notarioTitular: string;
  valorAdquisicionMxnFormatted: string;
  esOperacionEfectivoSinGravamen: boolean;
  aplicaFideicomisoZonaRestringida: boolean;
}

export interface MexicoComplianceSection {
  repepStatus: 'clean' | 'flagged';
  reusStatus: 'clean' | 'flagged';
  carrierIft: string;
  isTcpaSafe: boolean;
  dictamenCnbvAmib: string;
}

export interface ExecutiveDossierData {
  reportId: string;
  tenantId: string;
  generatedAt: string;
  subjectTitle: string;
  overallScore: number;
  jurisdiction?: 'US' | 'MX';
  investorStatusBadge: 'Accredited Investor' | 'Qualified Purchaser' | 'Verified HNWI' | 'Unverified / Retail';
  corporateSection?: {
    entityName: string;
    state: string;
    filingNumber: string;
    status: string;
    registeredAgent: string;
    managers: Array<{ name: string; role: string }>;
    uboName: string | null;
  };
  propertySection?: {
    address: string;
    county: string;
    parcelId: string;
    marketValueFormatted: string;
    mortgageBalanceFormatted: string;
    equityFormatted: string;
    equityPercent: number;
    isTaxDelinquent: boolean;
  };
  regulatorySection?: {
    hasFormD: boolean;
    hasFormADV: boolean;
    activeLicenses: string[];
    hasDisciplinaryHistory: boolean;
    verdictSummary: string;
  };
  contactSection?: {
    phoneFormatted?: string;
    lineType?: string;
    carrierName?: string;
    dncStatus?: string;
    email?: string;
    smtpVerified?: boolean;
    isTcpaSafe?: boolean;
  };
  mexicoCorporateSection?: MexicoCorporateSection;
  mexicoPropertySection?: MexicoPropertySection;
  mexicoComplianceSection?: MexicoComplianceSection;
}
