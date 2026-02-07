import { supabase } from './supabase';
import { Student, Shift, DepartureMethod } from '../types';

export const studentService = {
    async fetchStudents(): Promise<Student[]> {
        const { data, error } = await supabase
            .from('ALUNOS')
            .select(`
        *,
        DADOS_ALUNOS (*)
      `);

        if (error) {
            console.error('Error fetching students:', error);
            throw error;
        }

        if (!data) return [];

        return data.map((row: any) => {
            // Join dados_alunos (should be a single object due to 1:1, but select returns array sometimes? No, with 1:1 it is object if configured right, but let's be safe)
            const details = row.DADOS_ALUNOS || {}; // It might be an object or array depending on Supabase query. Usually object for query using FK.
            // Actually, if it's 1:1, Supabase returns an object or null if we use the right syntax.
            // But commonly it might be an array if not forced. Let's assume object for now based on FK.

            const gradeCombined = (row.serie_aluno && row.turma_aluno)
                ? `${row.serie_aluno} ${row.turma_aluno}`
                : row.serie_aluno || '';

            return {
                id: row.id_aluno.toString(), // Convert BigInt/Number to String for App
                name: row.nome_aluno || '',
                registrationNumber: row.ra || '',
                rga: row.rga || '',
                studentRG: row.rg_aluno || '',
                studentCPF: row.cpf_aluno || '',
                roomNumber: row.n_sala || '',
                shift: (row.periodo_aluno as Shift) || Shift.MORNING,
                grade: gradeCombined,
                photoUrl: row.foto_aluno || '',
                birthDate: row.data_nasc_aluno || '',
                departureMethod: (row.como_vai_embora as DepartureMethod) || 'Responsável',
                studentStatus: row.situacao_aluno || 'Ativo',
                imageRightsSigned: row.direito_imagem_assinado ? 'Sim' : 'Não',

                // Dados Alunos Fields
                filiacao1: details.responsavel_1_aluno || '',
                obsFiliacao1: details.obs_responsavel_1_aluno || '',
                telefone1: details.tel_responsavel_1_aluno || '',
                resp1RG: details.rg_responsavel_1_aluno || '',
                resp1CPF: details.cpf_resp_1_aluno || '',

                filiacao2: details.responsavel_2_aluno || '',
                obsFiliacao2: details.obs_responsavel_2_aluno || '',
                telefone2: details.tel_responsavel_2_aluno || '',
                resp2RG: details.rg_responsavel_2_aluno || '',
                resp2CPF: details.cpf_resp_2_aluno || '',

                telefone3: details.telefone_3_aluno || '',
                obsTelefone3: details.obs_telefone_3_aluno || '',
                telefone4: details.telefone_4_aluno || '',
                obsTelefone4: details.obs_telefone_4_aluno || ''
            };
        });
    },

    async createStudent(student: Student): Promise<void> {
        const id = parseInt(student.id); // Assuming ID is numeric string from input

        // Split grade
        const [serie, ...turmaParts] = student.grade.split(' ');
        const turma = turmaParts.join(' ');

        // Insert into ALUNOS
        const { error: errorAlunos } = await supabase.from('ALUNOS').insert({
            id_aluno: id,
            nome_aluno: student.name,
            ra: student.registrationNumber,
            rga: student.rga,
            rg_aluno: student.studentRG,
            cpf_aluno: student.studentCPF,
            n_sala: student.roomNumber,
            periodo_aluno: student.shift,
            serie_aluno: serie,
            turma_aluno: turma,
            foto_aluno: student.photoUrl,
            data_nasc_aluno: student.birthDate || null, // Date or null
            como_vai_embora: student.departureMethod,
            situacao_aluno: student.studentStatus,
            direito_imagem_assinado: student.imageRightsSigned === 'Sim'
        });

        if (errorAlunos) throw errorAlunos;

        // Insert into DADOS_ALUNOS
        const { error: errorDados } = await supabase.from('DADOS_ALUNOS').insert({
            id_aluno: id,
            responsavel_1_aluno: student.filiacao1,
            obs_responsavel_1_aluno: student.obsFiliacao1,
            tel_responsavel_1_aluno: student.telefone1,
            rg_responsavel_1_aluno: student.resp1RG,
            cpf_resp_1_aluno: student.resp1CPF,
            responsavel_2_aluno: student.filiacao2,
            obs_responsavel_2_aluno: student.obsFiliacao2,
            tel_responsavel_2_aluno: student.telefone2,
            rg_responsavel_2_aluno: student.resp2RG,
            cpf_resp_2_aluno: student.resp2CPF,
            telefone_3_aluno: student.telefone3,
            obs_telefone_3_aluno: student.obsTelefone3,
            telefone_4_aluno: student.telefone4,
            obs_telefone_4_aluno: student.obsTelefone4
        });

        if (errorDados) {
            // Rollback? Supabase doesn't support multi-table transactions via JS client easily without RPC.
            // For now, simple error throwing.
            console.error('Error creating DADOS_ALUNOS:', errorDados);
            throw errorDados;
        }
    },

    async updateStudent(student: Student): Promise<void> {
        const id = parseInt(student.id);
        const [serie, ...turmaParts] = student.grade.split(' ');
        const turma = turmaParts.join(' ');

        const { error: errorAlunos } = await supabase.from('ALUNOS').update({
            nome_aluno: student.name,
            ra: student.registrationNumber,
            rga: student.rga,
            rg_aluno: student.studentRG,
            cpf_aluno: student.studentCPF,
            n_sala: student.roomNumber,
            periodo_aluno: student.shift,
            serie_aluno: serie,
            turma_aluno: turma,
            foto_aluno: student.photoUrl,
            data_nasc_aluno: student.birthDate || null,
            como_vai_embora: student.departureMethod,
            situacao_aluno: student.studentStatus,
            direito_imagem_assinado: student.imageRightsSigned === 'Sim'
        }).eq('id_aluno', id);

        if (errorAlunos) throw errorAlunos;

        const { error: errorDados } = await supabase.from('DADOS_ALUNOS').update({
            responsavel_1_aluno: student.filiacao1,
            obs_responsavel_1_aluno: student.obsFiliacao1,
            tel_responsavel_1_aluno: student.telefone1,
            rg_responsavel_1_aluno: student.resp1RG,
            cpf_resp_1_aluno: student.resp1CPF,
            responsavel_2_aluno: student.filiacao2,
            obs_responsavel_2_aluno: student.obsFiliacao2,
            tel_responsavel_2_aluno: student.telefone2,
            rg_responsavel_2_aluno: student.resp2RG,
            cpf_resp_2_aluno: student.resp2CPF,
            telefone_3_aluno: student.telefone3,
            obs_telefone_3_aluno: student.obsTelefone3,
            telefone_4_aluno: student.telefone4,
            obs_telefone_4_aluno: student.obsTelefone4
        }).eq('id_aluno', id);

        if (errorDados) throw errorDados;
    },

    async deleteStudent(id: string): Promise<void> {
        // Cascade delete handles DADOS_ALUNOS
        const { error } = await supabase.from('ALUNOS').delete().eq('id_aluno', parseInt(id));
        if (error) throw error;
    }
};
