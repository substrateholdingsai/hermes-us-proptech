export type MexicoHarvestSource =
  | 'siger_sapi'
  | 'rppyc_luxury_acquisitions'
  | 'cnbv_qualified_investors';

export interface MexicoHarvestParams {
  source: MexicoHarvestSource;
  limit?: number;
  entidadFederativa?: 'CDMX' | 'NL' | 'JAL' | 'QROO' | 'YUC' | 'BCS';
  minAmountMxn?: number;
  autoEnrich?: boolean;
}

export interface MexicoLeadMetadata {
  folioMercantil?: string;
  rfcClave?: string;
  notariaNumero?: number;
  notarioTitular?: string;
  regimenFiscal?: string;
  repepStatus: 'clean' | 'flagged';
  reusStatus: 'clean' | 'flagged';
  carrierIft?: 'Telcel' | 'AT&T Mexico' | 'Movistar' | 'Altan Redes' | 'Fijo';
}
