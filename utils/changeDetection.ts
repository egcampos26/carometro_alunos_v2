import { Student } from '../types';

// Mapeamento de nomes de campos para nomes amigáveis em português
const fieldLabels: Record<string, string> = {
    name: 'Nome',
    registrationNumber: 'RA',
    rga: 'RGA',
    studentRG: 'RG do Aluno',
    studentCPF: 'CPF do Aluno',
    roomNumber: 'Número da Sala',
    shift: 'Período',
    grade: 'Turma',
    photoUrl: 'Foto',
    filiacao1: 'Filiação 1',
    obsFiliacao1: 'Obs. Filiação 1',
    telefone1: 'Telefone 1',
    resp1RG: 'RG Responsável 1',
    resp1CPF: 'CPF Responsável 1',
    filiacao2: 'Filiação 2',
    obsFiliacao2: 'Obs. Filiação 2',
    telefone2: 'Telefone 2',
    resp2RG: 'RG Responsável 2',
    resp2CPF: 'CPF Responsável 2',
    telefone3: 'Telefone 3',
    obsTelefone3: 'Obs. Telefone 3',
    telefone4: 'Telefone 4',
    obsTelefone4: 'Obs. Telefone 4',
    birthDate: 'Data de Nascimento',
    departureMethod: 'Como Vai Embora',
    studentStatus: 'Status do Aluno',
    imageRightsSigned: 'Direito de Imagem'
};

interface FieldChange {
    field: string;
    label: string;
    oldValue: any;
    newValue: any;
}

/**
 * Compara dois objetos Student e retorna uma lista de mudanças
 */
export function detectStudentChanges(oldStudent: Student, newStudent: Student): FieldChange[] {
    const changes: FieldChange[] = [];

    // Campos a ignorar na comparação
    const ignoreFields = ['id'];

    // Comparar cada campo
    Object.keys(newStudent).forEach(key => {
        if (ignoreFields.includes(key)) return;

        const oldValue = (oldStudent as any)[key];
        const newValue = (newStudent as any)[key];

        // Comparar valores (tratando null, undefined e string vazia como equivalentes)
        const oldNormalized = oldValue === null || oldValue === undefined ? '' : String(oldValue);
        const newNormalized = newValue === null || newValue === undefined ? '' : String(newValue);

        if (oldNormalized !== newNormalized) {
            changes.push({
                field: key,
                label: fieldLabels[key] || key,
                oldValue: oldValue || '(vazio)',
                newValue: newValue || '(vazio)'
            });
        }
    });

    return changes;
}

/**
 * Formata as mudanças em uma string legível para o log
 */
export function formatChangesForLog(changes: FieldChange[]): string {
    if (changes.length === 0) {
        return 'Nenhuma alteração detectada.';
    }

    const changesList = changes.map(change => {
        // Truncar valores muito longos (como URLs de fotos)
        const formatValue = (val: any): string => {
            const str = String(val);
            if (str.startsWith('data:image') || str.startsWith('http')) {
                return '[Imagem/URL]';
            }
            return str.length > 50 ? str.substring(0, 47) + '...' : str;
        };

        return `• ${change.label}: "${formatValue(change.oldValue)}" → "${formatValue(change.newValue)}"`;
    }).join('\n');

    return `${changes.length} campo(s) alterado(s):\n${changesList}`;
}
