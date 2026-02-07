import { supabase } from './supabase';
import { LogEntry } from '../types';

export const logService = {
    async fetchLogs(): Promise<LogEntry[]> {
        const { data, error } = await supabase
            .from('LOG_CAROMETRO_ALUNOS')
            .select('*')
            .order('timestamp_log', { ascending: false })
            .limit(1000); // Limita a 1000 logs mais recentes

        if (error) {
            console.error('Error fetching logs:', error);
            throw error;
        }

        if (!data) return [];

        return data.map((row: any) => ({
            id: row.id_log.toString(),
            timestamp: row.timestamp_log,
            user: row.usuario_log,
            action: row.acao_log,
            details: row.detalhes_log || ''
        }));
    },

    async createLog(log: Omit<LogEntry, 'id'>): Promise<void> {
        const { error } = await supabase.from('LOG_CAROMETRO_ALUNOS').insert({
            timestamp_log: log.timestamp,
            usuario_log: log.user,
            acao_log: log.action,
            detalhes_log: log.details
        });

        if (error) {
            console.error('Error creating log:', error);
            throw error;
        }
    },

    async clearOldLogs(daysToKeep: number = 90): Promise<void> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const { error } = await supabase
            .from('LOG_CAROMETRO_ALUNOS')
            .delete()
            .lt('timestamp_log', cutoffDate.toISOString());

        if (error) {
            console.error('Error clearing old logs:', error);
            throw error;
        }
    }
};
