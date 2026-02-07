
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
  category: 'Comportamental' | 'Acadêmica' | 'Médica' | 'Outros';
  registeredBy: string;
  isConfidential?: boolean; // Indica se a ocorrência é sigilosa
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
  studentStatus: 'Ativo' | 'Inativo' | 'Transferido';
  imageRightsSigned?: 'Sim' | 'Não'; // Novo campo: Direito de Imagem
  // Mantendo para compatibilidade caso existam referências
  guardianName?: string;
  guardianPhone?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'Admin' | 'Teacher';
  email: string;
}
