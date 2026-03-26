/**
 * DataJud Connector
 * Handles all communication with CNJ DataJud API
 */
import { DataJudEndpointResolver } from './datajud-endpoint-resolver';
import { createHash } from 'crypto';

const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || '';
const REQUEST_TIMEOUT_MS = 30000;

export interface DataJudMovement {
  data: string | null;
  descricao: string;
  complemento?: string;
  codigo?: number;
}

export interface DataJudProcessData {
  numeroProcesso: string;
  classe?: { codigo: number; nome: string };
  orgaoJulgador?: { codigo: number; nome: string };
  dataAjuizamento?: string;
  assuntos?: Array<{ codigo: number; nome: string }>;
  movimentos?: DataJudMovement[];
  grau?: string;
  formato?: any;
  raw?: any;
}

export interface NormalizedMovement {
  dataMovimentacao: string | null;
  descricaoOriginal: string;
  descricaoNormalizada: string;
  hashMovimentacao: string;
  relevancia: string;
  origemEvento: string;
}

export class DataJudConnector {
  static getSourceName(): string {
    return 'datajud';
  }

  static isAvailable(): boolean {
    return !!DATAJUD_API_KEY;
  }

  /**
   * Search for a process by CNJ number in the given tribunal
   */
  static async findProcessByNumber(
    numeroProcesso: string,
    tribunal: string
  ): Promise<DataJudProcessData | null> {
    const endpoint = DataJudEndpointResolver.getEndpoint(tribunal);

    const body = {
      query: {
        match: {
          numeroProcesso: numeroProcesso.replace(/[.\-]/g, ''),
        },
      },
    };

    const response = await this.makeRequest(endpoint, body);
    const hits = response?.hits?.hits;
    if (!hits || hits.length === 0) return null;

    return this.normalizeResponse(hits[0]._source);
  }

  /**
   * Fetch full process metadata
   */
  static async fetchProcessMetadata(
    numeroProcesso: string,
    tribunal: string
  ): Promise<DataJudProcessData | null> {
    return this.findProcessByNumber(numeroProcesso, tribunal);
  }

  /**
   * Fetch movements for a process
   */
  static async fetchProcessMovements(
    numeroProcesso: string,
    tribunal: string
  ): Promise<NormalizedMovement[]> {
    const data = await this.findProcessByNumber(numeroProcesso, tribunal);
    if (!data || !data.movimentos) return [];

    return data.movimentos.map((mov) =>
      this.normalizeMovement(mov, numeroProcesso)
    );
  }

  /**
   * Normalize raw DataJud response into standard format
   */
  static normalizeResponse(source: any): DataJudProcessData {
    return {
      numeroProcesso: source.numeroProcesso,
      classe: source.classe,
      orgaoJulgador: source.orgaoJulgador,
      dataAjuizamento: source.dataAjuizamento,
      assuntos: source.assuntos,
      movimentos: (source.movimentos || []).map((m: any) => ({
        data: m.dataHora || null,
        descricao: m.nome || m.descricao || 'Movimentação',
        complemento: (m.complementosTabelados || [])
          .map((c: any) => `${c.nome}: ${c.valor}`)
          .join('; '),
        codigo: m.codigo,
      })),
      grau: source.grau,
      raw: source,
    };
  }

  /**
   * Normalize a single movement and generate dedup hash
   */
  static normalizeMovement(
    mov: DataJudMovement,
    numeroProcesso: string
  ): NormalizedMovement {
    const descOriginal = mov.complemento
      ? `${mov.descricao} - ${mov.complemento}`
      : mov.descricao;

    const hashInput = `${numeroProcesso}|${mov.data || ''}|${mov.descricao}|${mov.codigo || ''}`;
    const hash = createHash('sha256').update(hashInput).digest('hex').substring(0, 40);

    return {
      dataMovimentacao: mov.data || null,
      descricaoOriginal: descOriginal,
      descricaoNormalizada: mov.descricao,
      hashMovimentacao: hash,
      relevancia: 'normal',
      origemEvento: 'datajud',
    };
  }

  /**
   * Make HTTP request to DataJud API with timeout
   */
  private static async makeRequest(endpoint: string, body: any): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `APIKey ${DATAJUD_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `DataJud API error [${response.status}]: ${text.substring(0, 500)}`
        );
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
