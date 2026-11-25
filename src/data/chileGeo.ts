import { CurrencyCode } from '../types/crm';

export interface ComunaItem {
  provincia: string;
  comunas: string[];
}

export const CHILE_GEO: Record<string, ComunaItem[]> = {
  'Región Metropolitana de Santiago': [
    {
      provincia: 'Santiago',
      comunas: [
        'Santiago',
        'Las Condes',
        'Providencia',
        'Vitacura',
        'Ñuñoa',
        'La Reina',
        'Lo Barnechea',
        'Huechuraba',
        'Maipú',
        'Pudahuel',
        'Quilicura',
        'San Miguel',
        'Macul',
        'Peñalolén',
      ],
    },
    {
      provincia: 'Cordillera',
      comunas: ['Puente Alto', 'Pirque', 'San José de Maipo'],
    },
    {
      provincia: 'Maipo',
      comunas: ['San Bernardo', 'Buin', 'Calera de Tango', 'Paine'],
    },
  ],
  'Región de Valparaíso': [
    {
      provincia: 'Valparaíso',
      comunas: ['Valparaíso', 'Viña del Mar', 'Concón', 'Quintero', 'Puchuncaví'],
    },
    {
      provincia: 'Marga Marga',
      comunas: ['Quilpué', 'Villa Alemana', 'Limache', 'Olmué'],
    },
    {
      provincia: 'San Antonio',
      comunas: ['San Antonio', 'Cartagena', 'Algarrobo'],
    },
  ],
  'Región del Biobío': [
    {
      provincia: 'Concepción',
      comunas: ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Chiguayante', 'Coronel', 'Hualpén'],
    },
    {
      provincia: 'Biobío',
      comunas: ['Los Ángeles', 'Nacimiento', 'Cabrero'],
    },
  ],
  'Región de Antofagasta': [
    {
      provincia: 'Antofagasta',
      comunas: ['Antofagasta', 'Mejillones', 'Taltal'],
    },
    {
      provincia: 'El Loa',
      comunas: ['Calama', 'San Pedro de Atacama'],
    },
  ],
  'Región de Los Lagos': [
    {
      provincia: 'Llanquihue',
      comunas: ['Puerto Montt', 'Puerto Varas', 'Llanquihue', 'Frutillar'],
    },
    {
      provincia: 'Osorno',
      comunas: ['Osorno', 'Purranque', 'Río Negro'],
    },
  ],
  'Región de O\'Higgins': [
    {
      provincia: 'Cachapoal',
      comunas: ['Rancagua', 'Machalí', 'Rengo', 'San Vicente'],
    },
  ],
  'Región de Coquimbo': [
    {
      provincia: 'Elqui',
      comunas: ['La Serena', 'Coquimbo', 'Vicuña'],
    },
  ],
  'Región de La Araucanía': [
    {
      provincia: 'Cautín',
      comunas: ['Temuco', 'Padre Las Casas', 'Villarrica', 'Pucón'],
    },
  ],
};

export const REGIONES_CHILE = Object.keys(CHILE_GEO);

export function getProvinciasByRegion(region: string): string[] {
  return (CHILE_GEO[region] || []).map((p) => p.provincia);
}

export function getComunasByRegionAndProvincia(region: string, provincia?: string): string[] {
  const items = CHILE_GEO[region] || [];
  if (provincia) {
    const found = items.find((p) => p.provincia === provincia);
    return found ? found.comunas : [];
  }
  return items.flatMap((p) => p.comunas);
}

/**
 * Formats a Chilean RUT cleanly: 76432198k -> 76.432.198-K
 */
export function formatRUT(raw: string): string {
  const cleaned = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length <= 1) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

export function isValidRUTFormat(rut: string): boolean {
  if (!rut) return false;
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (cleaned.length < 7 || cleaned.length > 9) return false;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
  return dv === expected;
}

export const DEFAULT_RATES = {
  CLP: 1,
  UF: 38250,
  USD: 965,
  EUR: 1030,
};

export function convertToCLP(amount: number, currency: CurrencyCode, rates = DEFAULT_RATES): number {
  return Math.round(amount * (rates[currency] || 1));
}

export function convertFromCLP(amountCLP: number, targetCurrency: CurrencyCode, rates = DEFAULT_RATES): number {
  if (targetCurrency === 'CLP') return Math.round(amountCLP);
  return amountCLP / (rates[targetCurrency] || 1);
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'CLP'): string {
  if (currency === 'CLP') {
    return `$ ${Math.round(amount).toLocaleString('es-CL')}`;
  }
  if (currency === 'UF') {
    return `UF ${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === 'USD') {
    return `US$ ${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `€ ${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Formats ISO date YYYY-MM-DD to Chilean DD/MM/YYYY
 */
export function formatDateCL(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
