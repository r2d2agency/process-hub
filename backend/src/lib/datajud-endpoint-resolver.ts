/**
 * DataJud Endpoint Resolver
 * Maps tribunal aliases to DataJud API endpoints
 */

const DATAJUD_BASE_URL = process.env.DATAJUD_BASE_URL || 'https://api-publica.datajud.cnj.jus.br';

const TRIBUNAL_MAP: Record<string, string> = {
  tjsp: 'api_publica_tjsp',
  trt2: 'api_publica_trt2',
};

// CNJ number format: NNNNNNN-DD.AAAA.J.TT.OOOO
// J = Justiça, TT = Tribunal
const CNJ_TRIBUNAL_MAP: Record<string, string> = {
  '8.26': 'tjsp',   // Justiça Estadual (8), SP (26)
  '5.02': 'trt2',   // Justiça do Trabalho (5), TRT2 (02)
};

export class DataJudEndpointResolver {
  static getEndpoint(tribunal: string): string {
    const alias = TRIBUNAL_MAP[tribunal.toLowerCase()];
    if (!alias) throw new Error(`Tribunal não suportado: ${tribunal}`);
    return `${DATAJUD_BASE_URL}/${alias}/_search`;
  }

  static getSupportedTribunals(): string[] {
    return Object.keys(TRIBUNAL_MAP);
  }

  static isTribunalSupported(tribunal: string): boolean {
    return tribunal.toLowerCase() in TRIBUNAL_MAP;
  }

  /**
   * Attempts to detect tribunal from CNJ process number
   * Format: NNNNNNN-DD.AAAA.J.TT.OOOO
   */
  static detectTribunalFromNumber(numeroProcesso: string): string | null {
    const normalized = numeroProcesso.replace(/[.\-]/g, '');
    if (normalized.length !== 20) return null;

    // Extract J (position 13) and TT (positions 14-15)
    const parts = numeroProcesso.split('.');
    if (parts.length < 4) return null;

    const justica = parts[2]; // J
    const tribunal = parts[3]; // TT
    const key = `${justica}.${tribunal}`;

    return CNJ_TRIBUNAL_MAP[key] || null;
  }

  /**
   * Normalize CNJ number by removing punctuation
   */
  static normalizeProcessNumber(numero: string): string {
    return numero.replace(/[.\-\s]/g, '');
  }

  /**
   * Validate CNJ number format
   */
  static isValidCNJNumber(numero: string): boolean {
    const pattern = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
    return pattern.test(numero.trim());
  }
}
