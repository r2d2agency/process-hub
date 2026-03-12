export const mockSources = [
  { id: "1", code: "TJSP", name: "Tribunal de Justiça de São Paulo", type: "HTML", status: "active", lastRun: "2026-03-12T08:00:00", totalPublications: 45230 },
  { id: "2", code: "STJ", name: "Superior Tribunal de Justiça", type: "PDF", status: "active", lastRun: "2026-03-12T07:30:00", totalPublications: 32100 },
  { id: "3", code: "TRF3", name: "Tribunal Regional Federal 3ª Região", type: "HTML", status: "active", lastRun: "2026-03-12T06:45:00", totalPublications: 18900 },
  { id: "4", code: "DOU", name: "Diário Oficial da União", type: "PDF", status: "active", lastRun: "2026-03-12T05:00:00", totalPublications: 98500 },
  { id: "5", code: "TJSPDJN", name: "TJSP - Diário da Justiça", type: "PDF", status: "error", lastRun: "2026-03-11T23:00:00", totalPublications: 12300 },
  { id: "6", code: "TST", name: "Tribunal Superior do Trabalho", type: "API", status: "active", lastRun: "2026-03-12T07:00:00", totalPublications: 21000 },
];

export const mockClients = [
  { id: "1", type: "advogado", name: "Dr. Carlos Mendes", office: "Mendes & Associados", email: "carlos@mendes.adv.br", phone: "11999887766", cpfCnpj: "123.456.789-00", oab: "SP 123456", status: "active", rulesCount: 5, matchesCount: 42 },
  { id: "2", type: "advogado", name: "Dra. Ana Paula Silva", office: "Silva Advocacia", email: "ana@silva.adv.br", phone: "11988776655", cpfCnpj: "987.654.321-00", oab: "SP 654321", status: "active", rulesCount: 3, matchesCount: 28 },
  { id: "3", type: "cliente", name: "Empresa XYZ Ltda", office: "—", email: "juridico@xyz.com.br", phone: "11977665544", cpfCnpj: "12.345.678/0001-90", oab: "—", status: "active", rulesCount: 8, matchesCount: 15 },
  { id: "4", type: "advogado", name: "Dr. Roberto Almeida", office: "Almeida Law", email: "roberto@almeida.adv.br", phone: "11966554433", cpfCnpj: "456.789.123-00", oab: "SP 789012", status: "inactive", rulesCount: 2, matchesCount: 67 },
];

export const mockRules = [
  { id: "1", clientId: "1", clientName: "Dr. Carlos Mendes", type: "processo", value: "1234567-89.2024.8.26.0100", sources: ["TJSP", "TJSPDJN"], status: "active" },
  { id: "2", clientId: "1", clientName: "Dr. Carlos Mendes", type: "oab", value: "SP 123456", sources: ["ALL"], status: "active" },
  { id: "3", clientId: "2", clientName: "Dra. Ana Paula Silva", type: "nome", value: "Ana Paula Silva", sources: ["TJSP", "STJ", "TRF3"], status: "active" },
  { id: "4", clientId: "3", clientName: "Empresa XYZ Ltda", type: "cpf_cnpj", value: "12.345.678/0001-90", sources: ["DOU", "TJSP"], status: "active" },
  { id: "5", clientId: "3", clientName: "Empresa XYZ Ltda", type: "keyword", value: "cumprimento de sentença", sources: ["TJSP"], status: "active" },
];

export const mockPublications = [
  { id: "1", source: "TJSP", date: "2026-03-12", process: "1234567-89.2024.8.26.0100", parties: "João Silva vs Maria Santos", excerpt: "Vistos. Ante o exposto, JULGO PROCEDENTE o pedido...", status: "processed" },
  { id: "2", source: "STJ", date: "2026-03-12", process: "9876543-21.2024.3.00.0000", parties: "Empresa ABC vs União Federal", excerpt: "RECURSO ESPECIAL. TRIBUTÁRIO. ICMS...", status: "processed" },
  { id: "3", source: "DOU", date: "2026-03-11", process: "—", parties: "—", excerpt: "PORTARIA Nº 123, DE 10 DE MARÇO DE 2026...", status: "processed" },
  { id: "4", source: "TRF3", date: "2026-03-11", process: "5001234-56.2025.4.03.6100", parties: "Pedro Oliveira vs INSS", excerpt: "APELAÇÃO CÍVEL. PREVIDENCIÁRIO...", status: "pending" },
];

export const mockMatches = [
  { id: "1", clientName: "Dr. Carlos Mendes", rule: "OAB SP 123456", source: "TJSP", date: "2026-03-12", process: "1234567-89.2024.8.26.0100", notified: true },
  { id: "2", clientName: "Dra. Ana Paula Silva", rule: "Nome: Ana Paula Silva", source: "STJ", date: "2026-03-12", process: "9876543-21.2024.3.00.0000", notified: true },
  { id: "3", clientName: "Empresa XYZ Ltda", rule: "CNPJ: 12.345.678/0001-90", source: "DOU", date: "2026-03-11", process: "—", notified: false },
  { id: "4", clientName: "Dr. Carlos Mendes", rule: "Processo: 1234567-89.2024.8.26.0100", source: "TJSP", date: "2026-03-11", process: "1234567-89.2024.8.26.0100", notified: true },
];

export const mockNotifications = [
  { id: "1", client: "Dr. Carlos Mendes", channel: "whatsapp", status: "sent", date: "2026-03-12T08:15:00", message: "Nova publicação no TJSP...", attempts: 1 },
  { id: "2", client: "Dra. Ana Paula Silva", channel: "whatsapp", status: "sent", date: "2026-03-12T08:20:00", message: "Nova publicação no STJ...", attempts: 1 },
  { id: "3", client: "Empresa XYZ Ltda", channel: "email", status: "error", date: "2026-03-11T14:00:00", message: "Nova publicação no DOU...", attempts: 3 },
  { id: "4", client: "Dr. Roberto Almeida", channel: "sistema", status: "pending", date: "2026-03-11T15:30:00", message: "Nova publicação no TRF3...", attempts: 0 },
];

export const mockStats = {
  totalClients: 156,
  activeRules: 423,
  todayPublications: 1284,
  todayMatches: 87,
  pendingNotifications: 12,
  sourcesActive: 68,
  sourcesError: 3,
  totalPublications: 2456780,
};
