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
            nomeFunc: row.nome_func, // Updated column name
            idFunc: row.id_func,
            groupId: row.group_id,
            isConfidential: row.is_confidential || false
        }));
    },

    async createOccurrence(occurrence: Occurrence): Promise<Occurrence> {
        const { data, error } = await supabase.from('OCORRENCIAS_ALUNOS').insert({
            id_aluno: parseInt(occurrence.studentId),
            date: occurrence.date,
            title: occurrence.title,
            description: occurrence.description,
            category: occurrence.category,
            nome_func: occurrence.nomeFunc, // Updated column name
            id_func: occurrence.idFunc || null, // Optional link to employee
            group_id: occurrence.groupId || null,
            is_confidential: occurrence.isConfidential || false
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
            isConfidential: data.is_confidential || false
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
            is_confidential: occurrence.isConfidential || false
        }).eq('id_ocorrencias', occurrence.id);


        if (error) {
            console.error('Supabase Error in updateOccurrence:', error);
            throw error;
        }
    },

    async deleteOccurrence(id: string): Promise<void> {
        const { error } = await supabase.from('OCORRENCIAS_ALUNOS').delete().eq('id_ocorrencias', id);
        if (error) throw error;
    }
};
