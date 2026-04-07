import { supabase } from './supabase';
import { Occurrence } from '../types';

export const occurrenceService = {
    async fetchOccurrences(): Promise<Occurrence[]> {
        const { data, error } = await supabase
            .from('OCORRENCIAS_ALUNOS')
            .select('*');

        if (error) {
            console.error('Error fetching occurrences:', error);
            throw error;
        }

        if (!data) return [];

        return data.map((row: any) => ({
            id: row.id_ocorrencias,
            studentId: row.id_aluno?.toString() || '',
            date: row.date,
            title: row.title,
            description: row.description,
            category: row.category,
            nomeFunc: row.nome_func,
            idFunc: row.id_func,
            groupId: row.group_id,
            isConfidential: row.is_confidential || false,
            tipoViolencia: row.tipo_violencia || null,
            priority: row.ocorr_prioridade_alunos || 'Média',
            itemRelacionado: row.item_relacionado || null,
            horaOcorrencia: row.hora_ocorrencia || undefined,
            dataRegistro: row.data_registro || undefined,
            horaRegistro: row.hora_registro || undefined,
        }));
    },

    async createOccurrence(occurrence: Occurrence): Promise<Occurrence> {
        const { data, error } = await supabase.from('OCORRENCIAS_ALUNOS').insert({
            id_aluno: parseInt(occurrence.studentId),
            date: occurrence.date,
            title: occurrence.title,
            description: occurrence.description,
            category: occurrence.category,
            nome_func: occurrence.nomeFunc,
            id_func: occurrence.idFunc || null,
            group_id: occurrence.groupId || null,
            is_confidential: occurrence.isConfidential || false,
            tipo_violencia: occurrence.tipoViolencia || null,
            ocorr_prioridade_alunos: occurrence.priority || 'Média',
            item_relacionado: occurrence.itemRelacionado || null,
            hora_ocorrencia: occurrence.horaOcorrencia || null,
            data_registro: occurrence.dataRegistro || null,
            hora_registro: occurrence.horaRegistro || null,
        }).select().single();

        if (error) throw error;

        return {
            id: data.id_ocorrencias,
            studentId: data.id_aluno?.toString() || '',
            date: data.date,
            title: data.title,
            description: data.description,
            category: data.category,
            nomeFunc: data.nome_func,
            idFunc: data.id_func,
            groupId: data.group_id,
            isConfidential: data.is_confidential || false,
            tipoViolencia: data.tipo_violencia || null,
            priority: data.ocorr_prioridade_alunos || 'Média',
            itemRelacionado: data.item_relacionado || null,
            horaOcorrencia: data.hora_ocorrencia || undefined,
            dataRegistro: data.data_registro || undefined,
            horaRegistro: data.hora_registro || undefined,
        };
    },

    async updateOccurrence(occurrence: Occurrence): Promise<void> {
        const { error } = await supabase.from('OCORRENCIAS_ALUNOS').update({
            date: occurrence.date,
            title: occurrence.title,
            description: occurrence.description,
            category: occurrence.category,
            nome_func: occurrence.nomeFunc,
            id_func: occurrence.idFunc || null,
            group_id: occurrence.groupId || null,
            is_confidential: occurrence.isConfidential || false,
            tipo_violencia: occurrence.tipoViolencia || null,
            ocorr_prioridade_alunos: occurrence.priority || 'Média',
            item_relacionado: occurrence.itemRelacionado || null,
            hora_ocorrencia: occurrence.horaOcorrencia || null,
            data_registro: occurrence.dataRegistro || null,
            hora_registro: occurrence.horaRegistro || null,
        }).eq('id_ocorrencias', occurrence.id);


        if (error) {
            console.error('Supabase Error in updateOccurrence:', error);
            throw error;
        }
    },

    async deleteOccurrence(id: string): Promise<void> {
        // Exclui todas as resoluções vinculadas primeiro (garante exclusão em cascata caso o ON DELETE CASCADE do Postgres não esteja ativo)
        const { error: resError } = await supabase.from('RESOLUCOES_OCORRENCIAS').delete().eq('id_ocorrencia', id);
        if (resError) {
            console.error('Error deleting related resolutions:', resError);
            throw resError;
        }

        const { error } = await supabase.from('OCORRENCIAS_ALUNOS').delete().eq('id_ocorrencias', id);
        if (error) throw error;
    }
};
