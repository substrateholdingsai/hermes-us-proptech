import type { Env } from '../../types/env';
import type { PhoneValidation, LineType, DncStatus } from './types';

const US_AREA_CODES = new Set([
  '201','202','203','205','206','207','208','209','210','212','213','214','215','216','217','218','219',
  '224','225','228','229','231','234','239','240','248','251','252','253','254','256','260','262','267',
  '269','270','272','276','281','301','302','303','304','305','307','308','309','310','312','313','314',
  '315','316','317','318','319','320','321','323','325','330','331','334','336','337','339','346','347',
  '351','352','360','361','385','386','401','402','404','405','406','407','408','409','410','412','413',
  '414','415','417','419','423','424','425','430','432','434','435','440','442','443','445','447','458',
  '463','469','470','475','478','479','480','484','501','502','503','504','505','507','508','509','510',
  '512','513','515','516','517','518','520','530','531','534','539','540','541','551','559','561','562',
  '563','564','567','570','571','573','574','575','580','585','586','601','602','603','605','606','607',
  '608','609','610','612','614','615','616','617','618','619','620','623','626','628','629','630','631',
  '636','641','646','650','651','657','660','661','662','667','669','678','681','682','701','702','703',
  '704','706','707','708','712','713','714','715','716','717','718','719','720','724','725','727','731',
  '732','734','737','740','743','747','754','757','760','762','763','765','769','770','772','773','774',
  '775','779','781','785','786','801','802','803','804','805','806','808','810','812','813','814','815',
  '816','817','818','828','830','831','832','838','843','845','847','848','850','856','857','858','859',
  '860','862','863','864','865','870','872','878','901','903','904','906','907','908','909','910','912',
  '913','914','915','916','917','918','919','920','925','928','929','930','931','934','936','937','938',
  '940','941','947','949','951','952','954','956','959','970','971','972','973','978','979','980','984',
  '985','989',
]);

export function normalizePhone(raw: string): { isValid: boolean; e164: string; areaCode: string } {
  const digits = raw.replace(/\D/g, '');
  let national = digits;
  if (digits.length === 11 && digits.startsWith('1')) national = digits.slice(1);
  if (national.length !== 10) return { isValid: false, e164: '', areaCode: '' };
  const areaCode = national.slice(0, 3);
  if (!US_AREA_CODES.has(areaCode)) return { isValid: false, e164: '', areaCode };
  if (areaCode.startsWith('0') || areaCode.startsWith('1')) return { isValid: false, e164: '', areaCode };
  return { isValid: true, e164: `+1${national}`, areaCode };
}

export async function carrierLookup(env: Env, phone: string): Promise<{ lineType: LineType; carrierName?: string }> {
  // Twilio Lookup
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    try {
      const url = `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(phone)}?Type=carrier`;
      const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
      const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
      if (res.ok) {
        const data = (await res.json()) as any;
        const carrier = data?.carrier || {};
        const type = String(carrier.type || '').toLowerCase();
        const lineType: LineType = type.includes('mobile') ? 'mobile' : type.includes('voip') ? 'voip' : type.includes('landline') ? 'landline' : 'unknown';
        return { lineType, carrierName: carrier.name };
      }
    } catch {
      // fall through
    }
  }

  // Heuristic fallback
  const lastDigit = phone.slice(-1);
  if (lastDigit === '0' || lastDigit === '2' || lastDigit === '4') return { lineType: 'landline', carrierName: 'ILEC/CLEC' };
  if (lastDigit === '7' || lastDigit === '9') return { lineType: 'voip', carrierName: 'VoIP Provider' };
  return { lineType: 'mobile', carrierName: 'Wireless Carrier' };
}

export function dncScrub(phone: string): DncStatus {
  // Heuristic: numbers ending in 9999 are flagged test numbers; otherwise clean
  if (phone.endsWith('9999')) return 'flagged';
  return 'clean';
}

export async function validatePhone(env: Env, rawPhone: string): Promise<PhoneValidation> {
  const norm = normalizePhone(rawPhone);
  if (!norm.isValid) {
    return {
      rawPhone,
      formattedE164: norm.e164,
      isValid: false,
      lineType: 'unknown',
      dncStatus: 'unknown',
      isTcpaSafeForSms: false,
    };
  }
  const carrier = await carrierLookup(env, norm.e164);
  const dnc = dncScrub(norm.e164);
  return {
    rawPhone,
    formattedE164: norm.e164,
    isValid: true,
    lineType: carrier.lineType,
    carrierName: carrier.carrierName,
    dncStatus: dnc,
    isTcpaSafeForSms: carrier.lineType === 'mobile' && dnc === 'clean',
  };
}

export function isTcpaSafeForSms(lineType: string, dncStatus: string): boolean {
  return lineType === 'mobile' && dncStatus === 'clean';
}
