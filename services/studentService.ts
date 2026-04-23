import { supabase } from './supabase';
import { Student, Shift, DepartureMethod } from '../types';

export const studentService = {
    async fetchStudents(): Promise<Student[]> {
        const { data, error } = await supabase
            .from('ALUNOS')
            .select(`
        *,
        DADOS_ALUNOS (*)
      `)
            .order('nome_aluno', { ascending: true });

        if (error) {
            console.error('Error fetching students:', error);
            throw error;
        }

        if (!data) {
            console.warn('No data returned from ALUNOS query');
            return [];
        }

        console.log(`✅ Loaded ${data.length} students from database`);

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
                registrationNumber: row.ra_aluno || '',
                rga: row.rga_aluno || '',
                studentRG: row.rg_aluno || '',
                studentCPF: row.cpf_aluno || '',
                roomNumber: row.n_sala_aluno || '',
                shift: (row.periodo_aluno as Shift) || Shift.MORNING,
                grade: gradeCombined,
                photoUrl: row.foto_aluno || '',
                birthDate: row.data_nasc_aluno || '',
                departureMethod: (row.como_vai_aluno as DepartureMethod) || 'Responsável',
                studentStatus: row.situacao_aluno || 'Ativo',
                imageRightsSigned: row.direito_imagem_assinado ? 'Sim' : 'Não',
                generoAluno: (row.genero_aluno as 'Masculino' | 'Feminino') || null,

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
        // Split grade
        const [serie, ...turmaParts] = student.grade.split(' ');
        const turma = turmaParts.join(' ');

        // Insert into ALUNOS (id_aluno is now IDENTITY)
        const payload: any = {
            nome_aluno: student.name,
            ra_aluno: student.registrationNumber,
            rga_aluno: student.rga,
            rg_aluno: student.studentRG,
            cpf_aluno: student.studentCPF,
            n_sala_aluno: student.roomNumber,
            periodo_aluno: student.shift,
            serie_aluno: serie,
            turma_aluno: turma,
            foto_aluno: student.photoUrl,
            data_nasc_aluno: student.birthDate || null,
            como_vai_aluno: student.departureMethod,
            situacao_aluno: student.studentStatus,
            direito_imagem_assinado: student.imageRightsSigned === 'Sim',
            genero_aluno: student.generoAluno || null
        };

        // If an ID is explicitly provided (useful for specialized syncs), use it
        if (student.id && parseInt(student.id) > 0) {
            payload.id_aluno = parseInt(student.id);
        }

        const { data: insertedStudent, error: errorAlunos } = await supabase
            .from('ALUNOS')
            .insert(payload)
            .select()
            .single();

        if (errorAlunos) throw errorAlunos;

        const newId = insertedStudent.id_aluno;

        // Insert into DADOS_ALUNOS
        const { error: errorDados } = await supabase.from('DADOS_ALUNOS').insert({
            id_aluno: newId,
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
            console.error('Error creating DADOS_ALUNOS:', errorDados);
            await supabase.from('ALUNOS').delete().eq('id_aluno', newId);
            throw errorDados;
        }
    },

    async updateStudent(student: Student): Promise<void> {
        const id = parseInt(student.id);
        if (isNaN(id)) {
            throw new Error(`Invalid student ID: ${student.id}`);
        }
        const [serie, ...turmaParts] = student.grade.split(' ');
        const turma = turmaParts.join(' ');

        const { error: errorAlunos } = await supabase.from('ALUNOS').update({
            nome_aluno: student.name,
            ra_aluno: student.registrationNumber,
            rga_aluno: student.rga,
            rg_aluno: student.studentRG,
            cpf_aluno: student.studentCPF,
            n_sala_aluno: student.roomNumber,
            periodo_aluno: student.shift,
            serie_aluno: serie,
            turma_aluno: turma,
            foto_aluno: student.photoUrl,
            data_nasc_aluno: student.birthDate || null,
            como_vai_aluno: student.departureMethod,
            situacao_aluno: student.studentStatus,
            direito_imagem_assinado: student.imageRightsSigned === 'Sim',
            genero_aluno: student.generoAluno || null
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
        const numericId = parseInt(id);
        if (isNaN(numericId)) {
            throw new Error(`Invalid student ID: ${id}`);
        }
        const { error } = await supabase.from('ALUNOS').delete().eq('id_aluno', numericId);
        if (error) throw error;
    },

    async syncStudents(inserts: Student[], updates: Student[]): Promise<{ success: boolean; errors: any[] }> {
        const errors: any[] = [];
        
        // 1. Process Updates in Batch (Supabase supports upsert, but update by ID is safer for specific columns)
        // Since Supabase doesn't have a direct "update multiple rows with different data" via standard REST, 
        // we use sequential but optimized processing or a custom RPC. For now, we'll keep sequential for updates 
        // but batch the inserts.
        for (const student of updates) {
            try {
                await this.updateStudent(student);
            } catch (err) {
                errors.push({ type: 'UPDATE', student: student.name, error: err });
            }
        }

        // 2. Process Inserts in Batch (MUCH faster)
        if (inserts.length > 0) {
            try {
                // Prepare payloads (ALUNOS)
                const alunosPayloads = inserts.map(s => {
                    const [serie, ...turmaParts] = s.grade.split(' ');
                    return {
                        nome_aluno: s.name,
                        ra_aluno: s.registrationNumber,
                        rga_aluno: s.rga,
                        rg_aluno: s.studentRG,
                        cpf_aluno: s.studentCPF,
                        n_sala_aluno: s.roomNumber,
                        periodo_aluno: s.shift,
                        serie_aluno: serie,
                        turma_aluno: turmaParts.join(' '),
                        foto_aluno: s.photoUrl,
                        data_nasc_aluno: s.birthDate || null,
                        como_vai_aluno: s.departureMethod,
                        situacao_aluno: s.studentStatus,
                        direito_imagem_assinado: s.imageRightsSigned === 'Sim',
                        genero_aluno: s.generoAluno || null
                    };
                });

                // Insert into ALUNOS and get inserted records with IDs
                const { data: insertedRows, error: insError } = await supabase
                    .from('ALUNOS')
                    .insert(alunosPayloads)
                    .select();

                if (insError) throw insError;

                // Prepare payloads (DADOS_ALUNOS) using the returned IDs
                // Note: We need to match back to the original inserts array to get detail fields.
                // Assuming the order is preserved (Supabase usually preserves it for batch inserts)
                const dadosPayloads = insertedRows.map((row, idx) => {
                    const original = inserts[idx];
                    return {
                        id_aluno: row.id_aluno,
                        responsavel_1_aluno: original.filiacao1,
                        obs_responsavel_1_aluno: original.obsFiliacao1,
                        tel_responsavel_1_aluno: original.telefone1,
                        rg_responsavel_1_aluno: original.resp1RG,
                        cpf_resp_1_aluno: original.resp1CPF,
                        responsavel_2_aluno: original.filiacao2,
                        obs_responsavel_2_aluno: original.obsFiliacao2,
                        tel_responsavel_2_aluno: original.telefone2,
                        rg_responsavel_2_aluno: original.resp2RG,
                        cpf_resp_2_aluno: original.resp2CPF,
                        telefone_3_aluno: original.telefone3,
                        obs_telefone_3_aluno: original.obsTelefone3,
                        telefone_4_aluno: original.telefone4,
                        obs_telefone_4_aluno: original.obsTelefone4
                    };
                });

                const { error: dadosError } = await supabase.from('DADOS_ALUNOS').insert(dadosPayloads);
                if (dadosError) throw dadosError;

            } catch (err) {
                console.error("Batch insert failed:", err);
                errors.push({ type: 'BATCH_INSERT', error: err });
            }
        }

        return {
            success: errors.length === 0,
            errors
        };
    }
};

