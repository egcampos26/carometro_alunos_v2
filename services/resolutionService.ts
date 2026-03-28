import { supabase } from './supabase';
import { OccurrenceResolution } from '../types';

const TABLE = 'RESOLUCOES_OCORRENCIAS';

const mapRow = (row: any): OccurrenceResolution => ({
  id: row.id.toString(),
  idOcorrencia: row.id_ocorrencia,
  idFunc: row.id_func || undefined,
  nomeResponsavel: row.nome_responsavel,
  statusOcorrencia: row.status_ocorrencia,
  dataAtendimento: row.data_atendimento,
  tiposIntervencao: row.tipos_intervencao || [],
  relatoResolucao: row.relato_resolucao || undefined,
  combinadosMetas: row.combinados_metas || undefined,
  necessitaMonitoramento: row.necessita_monitoramento || false,
  tempoMonitoramento: row.tempo_monitoramento || undefined,
  parecerGestao: row.parecer_gestao || undefined,
  encaminhamentoExterno: row.encaminhamento_externo || [],
  resultadoFinal: row.resultado_final || undefined,
  dataProximoFeedback: row.data_proximo_feedback || undefined,
  cienciaAluno: row.ciencia_aluno || false,
  cienciaFamilia: row.ciencia_familia || false,
  urlDocumentos: row.url_documentos || undefined,
  createdAt: row.created_at,
});

export const resolutionService = {
  async fetchResolutionsByOccurrence(occurrenceId: string): Promise<OccurrenceResolution[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id_ocorrencia', occurrenceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resolutions:', error);
      throw error;
    }

    return (data || []).map(mapRow);
  },

  async fetchAllResolutions(): Promise<OccurrenceResolution[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all resolutions:', error);
      throw error;
    }

    return (data || []).map(mapRow);
  },

  async createResolution(resolution: Omit<OccurrenceResolution, 'id' | 'createdAt'>): Promise<OccurrenceResolution> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id_ocorrencia: resolution.idOcorrencia,
        id_func: resolution.idFunc || null,
        nome_responsavel: resolution.nomeResponsavel,
        status_ocorrencia: resolution.statusOcorrencia,
        data_atendimento: resolution.dataAtendimento,
        tipos_intervencao: resolution.tiposIntervencao,
        relato_resolucao: resolution.relatoResolucao || null,
        combinados_metas: resolution.combinadosMetas || null,
        necessita_monitoramento: resolution.necessitaMonitoramento,
        tempo_monitoramento: resolution.tempoMonitoramento || null,
        parecer_gestao: resolution.parecerGestao || null,
        encaminhamento_externo: resolution.encaminhamentoExterno,
        resultado_final: resolution.resultadoFinal || null,
        data_proximo_feedback: resolution.dataProximoFeedback || null,
        ciencia_aluno: resolution.cienciaAluno,
        ciencia_familia: resolution.cienciaFamilia,
        url_documentos: resolution.urlDocumentos || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRow(data);
  },

  async updateResolution(resolution: OccurrenceResolution): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({
        nome_responsavel: resolution.nomeResponsavel,
        status_ocorrencia: resolution.statusOcorrencia,
        data_atendimento: resolution.dataAtendimento,
        tipos_intervencao: resolution.tiposIntervencao,
        relato_resolucao: resolution.relatoResolucao || null,
        combinados_metas: resolution.combinadosMetas || null,
        necessita_monitoramento: resolution.necessitaMonitoramento,
        tempo_monitoramento: resolution.tempoMonitoramento || null,
        parecer_gestao: resolution.parecerGestao || null,
        encaminhamento_externo: resolution.encaminhamentoExterno,
        resultado_final: resolution.resultadoFinal || null,
        data_proximo_feedback: resolution.dataProximoFeedback || null,
        ciencia_aluno: resolution.cienciaAluno,
        ciencia_familia: resolution.cienciaFamilia,
        url_documentos: resolution.urlDocumentos || null,
      })
      .eq('id', resolution.id);

    if (error) throw error;
  },

  async deleteResolution(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};
