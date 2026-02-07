
import { Student, Shift } from './types';

export const INSTITUTIONAL_BLUE = '#3b5998';

// Placeholder para quando o aluno não tem direito de imagem assinado
export const NO_IMAGE_RIGHTS_URL = 'https://img.freepik.com/premium-vector/no-photo-available-vector-icon-default-image-symbol-picture-coming-soon-for-web-site-mobile-app_87543-10615.jpg';

export const SHIFT_GRADES: Record<string, string[]> = {
  [Shift.MORNING]: ['5º A', '6º A', '6º B', '7º A', '7º B', '7º C', '8º A', '8º B', '8º C', '9º A', '9º B', '9º C'],
  [Shift.INTEGRAL]: ['1º A', '1º B', '1º C', '2º A', '2º B', '2º C', '3º A', '3º B'],
  [Shift.AFTERNOON]: ['4º A', '4º B', '5º B', '5º C']
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'ANA BEATRIZ SILVA COSTA',
    registrationNumber: 'RA001',
    rga: 'RGA987654',
    studentRG: '55.444.333-2',
    studentCPF: '444.333.222-11',
    roomNumber: '12',
    shift: Shift.MORNING,
    grade: '5º A',
    photoUrl: 'https://picsum.photos/seed/student1/300/400',
    filiacao1: 'ADRIANA MARIA REGIS DA SILVA',
    obsFiliacao1: 'Mãe - Recados',
    telefone1: '(11) 98888-7777',
    resp1RG: '22.111.000-X',
    resp1CPF: '111.222.333-44',
    filiacao2: 'MANOEL DA COSTA',
    obsFiliacao2: 'Pai',
    telefone2: '(11) 94444-5555',
    resp2RG: '33.222.111-Y',
    resp2CPF: '222.333.444-55',
    telefone3: '(11) 91111-2222',
    obsTelefone3: 'Tia materna',
    telefone4: '',
    obsTelefone4: '',
    birthDate: '2012-10-23',
    departureMethod: 'Responsável',
    studentStatus: 'Ativo',
    imageRightsSigned: 'Não'
  },
  {
    id: '2',
    name: 'BERNARDO CASTRO DE SOUZA',
    registrationNumber: 'RA002',
    rga: 'RGA987655',
    studentRG: '55.777.888-9',
    studentCPF: '555.666.777-88',
    roomNumber: '04',
    shift: Shift.INTEGRAL,
    grade: '1º A',
    photoUrl: 'https://picsum.photos/seed/student2/300/400',
    filiacao1: 'JOÃO DE SOUZA',
    obsFiliacao1: 'Pai',
    telefone1: '(11) 97777-6666',
    resp1RG: '11.444.555-6',
    resp1CPF: '999.888.777-66',
    filiacao2: 'MARIA DE CASTRO',
    obsFiliacao2: 'Mãe',
    telefone2: '',
    resp2RG: '',
    resp2CPF: '',
    telefone3: '',
    obsTelefone3: '',
    telefone4: '',
    obsTelefone4: '',
    birthDate: '2012-05-12',
    departureMethod: 'TEG',
    studentStatus: 'Ativo',
    imageRightsSigned: 'Não'
  }
];
