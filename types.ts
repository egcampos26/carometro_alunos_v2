
export enum Shift {
  MORNING = 'Manhã',
  AFTERNOON = 'Tarde',
  INTEGRAL = 'Integral',
  ALL = 'Todos'
}

export interface Occurrence {
  id: string;
  studentId: string;
  groupId?: string; // ID compartilhado por registros feitos via OccurrenceAddMulti
  date: string;
  title: string;
  description: string;
  category: 'Comportamental' | 'Pedagógica' | 'Médica' | 'Outros';
  nomeFunc: string; // Renamed from registeredBy
  idFunc?: string; // New field linked to FUNCIONARIOS
  registeredBy?: string; // Keeping for compatibility during migration if needed, but should be removed eventually
  isConfidential?: boolean; // Indica se a ocorrência é sigilosa
  tipoViolencia?: string | null; // Mapa de Violências (nullable)
  priority?: 'Urgente' | 'Alta' | 'Média' | 'Baixa'; // Prioridade da ocorrência
  itemRelacionado?: string | null; // Item relacionado à categoria
  horaOcorrencia?: string;
  dataRegistro?: string;
  horaRegistro?: string;
}

export interface OccurrenceResolution {
  id: string;
  idOcorrencia: string;
  idFunc?: string;
  nomeResponsavel: string;
  statusOcorrencia: 'Em andamento' | 'Resolvido' | 'Encaminhado' | 'Cancelado';
  dataAtendimento: string; // ISO string
  tiposIntervencao: string[];
  relatoResolucao?: string;
  combinadosMetas?: string;
  necessitaMonitoramento: boolean;
  tempoMonitoramento?: string;
  parecerGestao?: string;
  encaminhamentoExterno: string[];
  resultadoFinal?: 'Conciliado' | 'Penalidade Aplicada' | 'Em acompanhamento';
  dataProximoFeedback?: string;
  cienciaAluno: boolean;
  cienciaFamilia: boolean;
  urlDocumentos?: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export type DepartureMethod = 'TEG' | 'Sozinho' | 'Transporte' | 'Responsável';

export interface Student {
  id: string;
  name: string;
  registrationNumber: string; // RA
  rga: string; // Novo campo RGA
  studentRG: string; // RG do Aluno
  studentCPF: string; // CPF do Aluno
  roomNumber: string; // n_sala
  shift: Shift;
  grade: string; // Ex: 6º A
  photoUrl: string;
  filiacao1: string; // Responsável 1
  obsFiliacao1: string; // Observação Responsável 1
  telefone1: string; // Telefone Responsável 1
  resp1RG: string; // RG Responsável 1
  resp1CPF: string; // CPF Responsável 1
  filiacao2: string; // Responsável 2
  obsFiliacao2: string; // Observação Responsável 2
  telefone2: string; // Telefone Responsável 2
  resp2RG: string; // RG Responsável 2
  resp2CPF: string; // CPF Responsável 2
  telefone3: string; // Telefone Adicional 3
  obsTelefone3: string; // Observação Telefone 3
  telefone4: string; // Telefone Adicional 4
  obsTelefone4: string; // Observação Telefone 4
  birthDate: string;
  departureMethod: DepartureMethod; // como_vai_embora
  studentStatus: string; // Ex: 'Ativo', 'Inativo', 'Transferido', 'Vínculo Indevido', etc.
  imageRightsSigned?: 'Sim' | 'Não'; // Novo campo: Direito de Imagem
  generoAluno?: 'Masculino' | 'Feminino' | null; // Gênero do aluno
  // Mantendo para compatibilidade caso existam referências
  guardianName?: string;
  guardianPhone?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Editor' | 'User' | 'Coordinator' | 'Director';
  email: string;
  idFunc?: string; // ID do funcionário vinculado
}
