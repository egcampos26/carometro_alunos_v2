import { supabase } from './supabase';
import { Student, Shift, DepartureMethod } from '../types';

export const studentService = {
    async fetchStudents(): Promise<Student[]> {
        const { data, error } = await supabase
            .from('ALUNOS')
            .select(`
                *,
                ALUNOS_DADOS_GERAIS (*),
                ALUNOS_DOCUMENTOS (*),
                ALUNOS_MATRICULAS (*),
                ALUNOS_DADOS_SAUDE (*),
                ALUNOS_OUTROS (*),
                ALUNOS_CONTATOS (*),
                ALUNOS_ENDERECOS (*)
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
            const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;

            const dadosGerais = getSingle(row.ALUNOS_DADOS_GERAIS) || {};
            const documentos = getSingle(row.ALUNOS_DOCUMENTOS) || {};
            const outros = getSingle(row.ALUNOS_OUTROS) || {};
            const contatos = getSingle(row.ALUNOS_CONTATOS) || {};

            const matriculas = Array.isArray(row.ALUNOS_MATRICULAS) ? row.ALUNOS_MATRICULAS : (row.ALUNOS_MATRICULAS ? [row.ALUNOS_MATRICULAS] : []);
            const matricula = matriculas.find((m: any) => m.ano_letivo === 2026) || matriculas[0] || {};

            const serie = matricula.serie_aluno || matricula.serie || '';
            const turma = matricula.turma_aluno || matricula.turma || '';
            const gradeCombined = (serie && turma) ? `${serie} ${turma}` : (serie || '');

            return {
                id: row.id_aluno.toString(),
                name: row.nome_aluno || '',
                registrationNumber: row.ra_aluno || '',
                rga: row.rga_aluno || '',
                studentRG: documentos.rg_aluno || '',
                studentCPF: documentos.cpf_aluno || '',
                roomNumber: matricula.n_sala_aluno || matricula.numero_sala || '',
                shift: ((matricula.periodo_aluno || matricula.periodo) as Shift) || Shift.MORNING,
                grade: gradeCombined,
                photoUrl: outros.foto_aluno || '',
                birthDate: row.data_nasc_aluno || '',
                departureMethod: (outros.como_vai_aluno as DepartureMethod) || 'Responsável',
                studentStatus: outros.situacao_aluno || 'Ativo',
                imageRightsSigned: outros.direito_imagem_aluno ? 'Sim' : 'Não',
                generoAluno: (dadosGerais.genero_aluno as 'Masculino' | 'Feminino') || null,

                filiacao1: dadosGerais.filiacao1_aluno || '',
                obsFiliacao1: dadosGerais.obs_filiacao1_aluno || '',
                telefone1: dadosGerais.tel_filiacao1_aluno || '',
                resp1RG: dadosGerais.rg_filiacao1_aluno || '',
                resp1CPF: dadosGerais.cpf_filiacao_1_aluno || '',

                filiacao2: dadosGerais.filiacao2_aluno || '',
                obsFiliacao2: dadosGerais.obs_filiacao2_aluno || '',
                telefone2: dadosGerais.tel_filiacao2_aluno || '',
                resp2RG: dadosGerais.rg_filiacao2_aluno || '',
                resp2CPF: dadosGerais.cpf_filiacao_2_aluno || '',

                telefone3: contatos.telefone_3_aluno || '',
                obsTelefone3: contatos.obs_telefone_3_aluno || '',
                telefone4: contatos.telefone_4_aluno || '',
                obsTelefone4: contatos.obs_telefone_4_aluno || ''
            };
        });
    },

    async createStudent(student: Student): Promise<void> {
        const [serie, ...turmaParts] = student.grade.split(' ');
        const turma = turmaParts.join(' ');

        const payload: any = {
            nome_aluno: student.name,
            ra_aluno: student.registrationNumber,
            rga_aluno: student.rga,
            data_nasc_aluno: student.birthDate || null,
        };

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

        try {
            const { error: errorDadosGerais } = await supabase.from('ALUNOS_DADOS_GERAIS').insert({
                id_aluno: newId,
                nome_aluno: student.name,
                data_nasc_aluno: student.birthDate || null,
                genero_aluno: student.generoAluno || null,
                filiacao1_aluno: student.filiacao1,
                obs_filiacao1_aluno: student.obsFiliacao1,
                tel_filiacao1_aluno: student.telefone1,
                rg_filiacao1_aluno: student.resp1RG,
                cpf_filiacao_1_aluno: student.resp1CPF,
                filiacao2_aluno: student.filiacao2,
                obs_filiacao2_aluno: student.obsFiliacao2,
                tel_filiacao2_aluno: student.telefone2,
                rg_filiacao2_aluno: student.resp2RG,
                cpf_filiacao_2_aluno: student.resp2CPF,
            });
            if (errorDadosGerais) throw errorDadosGerais;

            const { error: errorDocs } = await supabase.from('ALUNOS_DOCUMENTOS').insert({
                id_aluno: newId,
                rg_aluno: student.studentRG,
                cpf_aluno: student.studentCPF,
            });
            if (errorDocs) throw errorDocs;

            const { error: errorOutros } = await supabase.from('ALUNOS_OUTROS').insert({
                id_aluno: newId,
                situacao_aluno: student.studentStatus || 'Ativo',
                como_vai_aluno: student.departureMethod || 'Responsável',
                foto_aluno: student.photoUrl,
                direito_imagem_aluno: student.imageRightsSigned === 'Sim',
            });
            if (errorOutros) throw errorOutros;

            const { error: errorContatos } = await supabase.from('ALUNOS_CONTATOS').insert({
                id_aluno: newId,
                telefone_3_aluno: student.telefone3,
                obs_telefone_3_aluno: student.obsTelefone3,
                telefone_4_aluno: student.telefone4,
                obs_telefone_4_aluno: student.obsTelefone4,
            });
            if (errorContatos) throw errorContatos;

            const { error: errorMatricula } = await supabase.from('ALUNOS_MATRICULAS').insert({
                id_aluno: newId,
                ano_letivo: 2026,
                n_sala_aluno: student.roomNumber,
                numero_sala: student.roomNumber,
                periodo_aluno: student.shift,
                periodo: student.shift,
                serie_aluno: serie,
                serie: serie,
                turma_aluno: turma,
                turma: turma,
                situacao_matricula: student.studentStatus || 'Ativo',
            });
            if (errorMatricula) throw errorMatricula;

            const { error: errorSaude } = await supabase.from('ALUNOS_DADOS_SAUDE').insert({
                id_aluno: newId,
            });
            if (errorSaude) throw errorSaude;

            const { error: errorEnderecos } = await supabase.from('ALUNOS_ENDERECOS').insert({
                id_aluno: newId,
            });
            if (errorEnderecos) throw errorEnderecos;

        } catch (error) {
            console.error('Error creating student sub-tables, rolling back main table insert:', error);
            await supabase.from('ALUNOS').delete().eq('id_aluno', newId);
            throw error;
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
            data_nasc_aluno: student.birthDate || null,
        }).eq('id_aluno', id);
        
        if (errorAlunos) throw errorAlunos;

        const { error: errorDadosGerais } = await supabase.from('ALUNOS_DADOS_GERAIS').upsert({
            id_aluno: id,
            nome_aluno: student.name,
            data_nasc_aluno: student.birthDate || null,
            genero_aluno: student.generoAluno || null,
            filiacao1_aluno: student.filiacao1,
            obs_filiacao1_aluno: student.obsFiliacao1,
            tel_filiacao1_aluno: student.telefone1,
            rg_filiacao1_aluno: student.resp1RG,
            cpf_filiacao_1_aluno: student.resp1CPF,
            filiacao2_aluno: student.filiacao2,
            obs_filiacao2_aluno: student.obsFiliacao2,
            tel_filiacao2_aluno: student.telefone2,
            rg_filiacao2_aluno: student.resp2RG,
            cpf_filiacao_2_aluno: student.resp2CPF,
        }, { onConflict: 'id_aluno' });
        
        if (errorDadosGerais) throw errorDadosGerais;

        const { error: errorDocs } = await supabase.from('ALUNOS_DOCUMENTOS').upsert({
            id_aluno: id,
            rg_aluno: student.studentRG,
            cpf_aluno: student.studentCPF,
        }, { onConflict: 'id_aluno' });
        
        if (errorDocs) throw errorDocs;

        const { error: errorOutros } = await supabase.from('ALUNOS_OUTROS').upsert({
            id_aluno: id,
            situacao_aluno: student.studentStatus || 'Ativo',
            como_vai_aluno: student.departureMethod || 'Responsável',
            foto_aluno: student.photoUrl,
            direito_imagem_aluno: student.imageRightsSigned === 'Sim',
        }, { onConflict: 'id_aluno' });
        
        if (errorOutros) throw errorOutros;

        const { error: errorContatos } = await supabase.from('ALUNOS_CONTATOS').upsert({
            id_aluno: id,
            telefone_3_aluno: student.telefone3,
            obs_telefone_3_aluno: student.obsTelefone3,
            telefone_4_aluno: student.telefone4,
            obs_telefone_4_aluno: student.obsTelefone4,
        }, { onConflict: 'id_aluno' });
        
        if (errorContatos) throw errorContatos;

        const { data: existingMatriculas, error: fetchMatError } = await supabase
            .from('ALUNOS_MATRICULAS')
            .select('id')
            .eq('id_aluno', id)
            .eq('ano_letivo', 2026);

        if (fetchMatError) throw fetchMatError;

        const matriculaPayload = {
            id_aluno: id,
            ano_letivo: 2026,
            n_sala_aluno: student.roomNumber,
            numero_sala: student.roomNumber,
            periodo_aluno: student.shift,
            periodo: student.shift,
            serie_aluno: serie,
            serie: serie,
            turma_aluno: turma,
            turma: turma,
            situacao_matricula: student.studentStatus || 'Ativo'
        };

        if (existingMatriculas && existingMatriculas.length > 0) {
            const { error: errorMatricula } = await supabase
                .from('ALUNOS_MATRICULAS')
                .update(matriculaPayload)
                .eq('id', existingMatriculas[0].id);
            if (errorMatricula) throw errorMatricula;
        } else {
            const { error: errorMatricula } = await supabase
                .from('ALUNOS_MATRICULAS')
                .insert(matriculaPayload);
            if (errorMatricula) throw errorMatricula;
        }
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
        
        for (const student of updates) {
            try {
                await this.updateStudent(student);
            } catch (err) {
                errors.push({ type: 'UPDATE', student: student.name, error: err });
            }
        }

        if (inserts.length > 0) {
            try {
                const alunosPayloads = inserts.map(s => ({
                    nome_aluno: s.name,
                    ra_aluno: s.registrationNumber,
                    rga_aluno: s.rga,
                    data_nasc_aluno: s.birthDate || null,
                }));

                const { data: insertedRows, error: insError } = await supabase
                    .from('ALUNOS')
                    .insert(alunosPayloads)
                    .select();

                if (insError) throw insError;

                const dadosGeraisPayloads = insertedRows.map((row, idx) => {
                    const original = inserts[idx];
                    return {
                        id_aluno: row.id_aluno,
                        nome_aluno: original.name,
                        data_nasc_aluno: original.birthDate || null,
                        genero_aluno: original.generoAluno || null,
                        filiacao1_aluno: original.filiacao1,
                        obs_filiacao1_aluno: original.obsFiliacao1,
                        tel_filiacao1_aluno: original.telefone1,
                        rg_filiacao1_aluno: original.resp1RG,
                        cpf_filiacao_1_aluno: original.resp1CPF,
                        filiacao2_aluno: original.filiacao2,
                        obs_filiacao2_aluno: original.obsFiliacao2,
                        tel_filiacao2_aluno: original.telefone2,
                        rg_filiacao2_aluno: original.resp2RG,
                        cpf_filiacao_2_aluno: original.resp2CPF,
                    };
                });

                const documentosPayloads = insertedRows.map((row, idx) => {
                    const original = inserts[idx];
                    return {
                        id_aluno: row.id_aluno,
                        rg_aluno: original.studentRG,
                        cpf_aluno: original.studentCPF,
                    };
                });

                const outrosPayloads = insertedRows.map((row, idx) => {
                    const original = inserts[idx];
                    return {
                        id_aluno: row.id_aluno,
                        situacao_aluno: original.studentStatus || 'Ativo',
                        como_vai_aluno: original.departureMethod || 'Responsável',
                        foto_aluno: original.photoUrl,
                        direito_imagem_aluno: original.imageRightsSigned === 'Sim',
                    };
                });

                const contatosPayloads = insertedRows.map((row, idx) => {
                    const original = inserts[idx];
                    return {
                        id_aluno: row.id_aluno,
                        telefone_3_aluno: original.telefone3,
                        obs_telefone_3_aluno: original.obsTelefone3,
                        telefone_4_aluno: original.telefone4,
                        obs_telefone_4_aluno: original.obsTelefone4,
                    };
                });

                const matriculasPayloads = insertedRows.map((row, idx) => {
                    const original = inserts[idx];
                    const [serie, ...turmaParts] = original.grade.split(' ');
                    const turma = turmaParts.join(' ');
                    return {
                        id_aluno: row.id_aluno,
                        ano_letivo: 2026,
                        n_sala_aluno: original.roomNumber,
                        numero_sala: original.roomNumber,
                        periodo_aluno: original.shift,
                        periodo: original.shift,
                        serie_aluno: serie,
                        serie: serie,
                        turma_aluno: turma,
                        turma: turma,
                        situacao_matricula: original.studentStatus || 'Ativo',
                    };
                });

                const saudePayloads = insertedRows.map(row => ({
                    id_aluno: row.id_aluno
                }));

                const enderecosPayloads = insertedRows.map(row => ({
                    id_aluno: row.id_aluno
                }));

                const { error: dadosError } = await supabase.from('ALUNOS_DADOS_GERAIS').insert(dadosGeraisPayloads);
                if (dadosError) throw dadosError;

                const { error: docsError } = await supabase.from('ALUNOS_DOCUMENTOS').insert(documentosPayloads);
                if (docsError) throw docsError;

                const { error: outrosError } = await supabase.from('ALUNOS_OUTROS').insert(outrosPayloads);
                if (outrosError) throw outrosError;

                const { error: contatosError } = await supabase.from('ALUNOS_CONTATOS').insert(contatosPayloads);
                if (contatosError) throw contatosError;

                const { error: matriculaError } = await supabase.from('ALUNOS_MATRICULAS').insert(matriculasPayloads);
                if (matriculaError) throw matriculaError;

                const { error: saudeError } = await supabase.from('ALUNOS_DADOS_SAUDE').insert(saudePayloads);
                if (saudeError) throw saudeError;

                const { error: enderecosError } = await supabase.from('ALUNOS_ENDERECOS').insert(enderecosPayloads);
                if (enderecosError) throw enderecosError;

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

