
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Occurrence, OccurrenceResolution, AuthUser, Student } from '../types';
import { resolutionService } from '../services/resolutionService';
import {
  CheckSquare, Square, ChevronRight, Plus, Clock, User, AlertCircle,
  ClipboardList, FileText, Send, CheckCircle2, XCircle, Loader2,
  Calendar, Eye, ChevronDown, Trash2, AlertTriangle, X, ExternalLink,
  Users, ShieldCheck, BookOpen, Activity
} from 'lucide-react';

// ─── Constantes ────────────────────────────────────────────────────────────────

const TIPOS_INTERVENCAO = [
  'Conversa individual com o aluno',
  'Mediação de conflito entre partes',
  'Contato telefônico com responsáveis',
  'Reunião presencial com a família',
  'Encaminhamento para rede de proteção (NAAPA/CT/UBS)',
  'Aplicação de medida educativa (conforme regimento)',
  'Ação reparadora / atividade de reflexão',
];

const ENCAMINHAMENTOS_EXTERNOS = [
  'NAAPA',
  'Conselho Tutelar',
  'CRAS',
  'CREAS',
  'CAPS i',
  'UBS',
  'SAMU / Resgate',
  'Supervisão de Ensino',
  'SGP',
  'Outros',
];

const STATUS_COLORS: Record<string, string> = {
  'Em andamento': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Resolvido': 'bg-green-100 text-green-700 border-green-200',
  'Encaminhado': 'bg-blue-100 text-blue-700 border-blue-200',
  'Cancelado': 'bg-gray-100 text-gray-500 border-gray-200',
};

const RESULTADO_COLORS: Record<string, string> = {
  'Conciliado': 'bg-green-100 text-green-700',
  'Penalidade Aplicada': 'bg-red-100 text-red-700',
  'Em acompanhamento': 'bg-blue-100 text-blue-600',
};

// ─── Tipos ─────────────────────────────────────────────────────────────────────

interface OccurrenceResolutionPageProps {
  occurrences: Occurrence[];
  students: Student[];
  resolutions: OccurrenceResolution[];
  user: AuthUser;
  onCreateResolution: (r: Omit<OccurrenceResolution, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateResolution: (r: OccurrenceResolution) => Promise<void>;
  onDeleteResolution: (id: string) => Promise<void>;
  notify?: (message: string, type: 'success' | 'error' | 'info') => void;
}


// ─── Formulário vazio ───────────────────────────────────────────────────────────

const emptyForm = (user: AuthUser, occurrenceId: string): Omit<OccurrenceResolution, 'id' | 'createdAt'> => ({
  idOcorrencia: occurrenceId,
  idFunc: user.idFunc,
  nomeResponsavel: user.name,
  statusOcorrencia: 'Em andamento',
  dataAtendimento: new Date().toISOString().slice(0, 16),
  tiposIntervencao: [],
  relatoResolucao: '',
  combinadosMetas: '',
  necessitaMonitoramento: false,
  tempoMonitoramento: '',
  parecerGestao: '',
  encaminhamentoExterno: [],
  resultadoFinal: undefined,
  dataProximoFeedback: '',
  cienciaAluno: false,
  cienciaFamilia: false,
  urlDocumentos: '',
});

// ─── Componente Checkbox ────────────────────────────────────────────────────────

const CheckItem: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all active:scale-95 ${checked
      ? 'bg-[#3b5998]/8 border-[#3b5998]/30 text-[#3b5998]'
      : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
      }`}
  >
    {checked
      ? <CheckSquare size={18} className="text-[#3b5998] shrink-0" />
      : <Square size={18} className="text-gray-300 shrink-0" />
    }
    <span className="text-xs font-semibold leading-snug">{label}</span>
  </button>
);

// ─── Cabeçalho de Seção ─────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl bg-[#3b5998]/10 flex items-center justify-center text-[#3b5998] shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight leading-none">{title}</h3>
      {subtitle && <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Card de Histórico ──────────────────────────────────────────────────────────

const HistoryCard: React.FC<{
  resolution: OccurrenceResolution;
  canDelete: boolean;
  onDelete: () => void;
  onEdit: () => void;
}> = ({ resolution, canDelete, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#3b5998]/10 flex items-center justify-center text-[#3b5998] shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
              {new Date(resolution.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs font-black text-gray-700 uppercase truncate">{resolution.nomeResponsavel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${STATUS_COLORS[resolution.statusOcorrencia] || 'bg-gray-100 text-gray-500'}`}>
            {resolution.statusOcorrencia}
          </span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-4">

          {/* Resultado */}
          {resolution.resultadoFinal && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resultado:</span>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${RESULTADO_COLORS[resolution.resultadoFinal] || 'bg-gray-100 text-gray-600'}`}>
                {resolution.resultadoFinal}
              </span>
            </div>
          )}

          {/* Tipos de intervenção */}
          {resolution.tiposIntervencao.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Intervenções:</p>
              <div className="flex flex-wrap gap-1.5">
                {resolution.tiposIntervencao.map(t => (
                  <span key={t} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Relato */}
          {resolution.relatoResolucao && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Relato:</p>
              <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{resolution.relatoResolucao}</p>
            </div>
          )}

          {/* Combinados */}
          {resolution.combinadosMetas && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Combinados e Metas:</p>
              <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{resolution.combinadosMetas}</p>
            </div>
          )}

          {/* Parecer */}
          {resolution.parecerGestao && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Parecer da Gestão:</p>
              <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{resolution.parecerGestao}</p>
            </div>
          )}

          {/* Encaminhamentos Externos */}
          {resolution.encaminhamentoExterno.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Encaminhamentos Externos:</p>
              <div className="flex flex-wrap gap-1.5">
                {resolution.encaminhamentoExterno.map(e => (
                  <span key={e} className="text-[10px] font-semibold bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">{e}</span>
                ))}
              </div>
            </div>
          )}

          {/* Linha de meta e monitoramento */}
          <div className="flex flex-wrap gap-4">
            {resolution.dataProximoFeedback && (
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Próximo Feedback:</p>
                <p className="text-xs font-bold text-gray-700">{new Date(resolution.dataProximoFeedback + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
            )}
            {resolution.necessitaMonitoramento && (
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Monitoramento:</p>
                <p className="text-xs font-bold text-amber-600">{resolution.tempoMonitoramento || 'Sim'}</p>
              </div>
            )}
          </div>

          {/* Ciência */}
          <div className="flex gap-3">
            <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full ${resolution.cienciaAluno ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {resolution.cienciaAluno ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              Aluno ciente
            </span>
            <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full ${resolution.cienciaFamilia ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {resolution.cienciaFamilia ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              Família ciente
            </span>
          </div>

          {/* Documentos */}
          {resolution.urlDocumentos && (
            <a
              href={resolution.urlDocumentos}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-black text-[#3b5998] hover:underline"
            >
              <ExternalLink size={12} />
              Ver documentos anexados
            </a>
          )}

          {/* Ações */}
          {canDelete && (
            <div className="flex gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 text-[#3b5998] text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95"
              >
                Editar
              </button>
              <button
                onClick={onDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Componente Principal ───────────────────────────────────────────────────────

const OccurrenceResolutionPage: React.FC<OccurrenceResolutionPageProps> = ({
  occurrences,
  students,
  resolutions: allResolutions,
  user,
  onCreateResolution,
  onUpdateResolution,
  onDeleteResolution,
  notify
}) => {

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const occurrence = occurrences.find(o => o.id === id);
  const student = occurrence ? students.find(s => s.id === occurrence.studentId) : null;

  // Resoluções desta ocorrência (em memória — já carregadas no App)
  const history = allResolutions
    .filter(r => r.idOcorrencia === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Formulário
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<OccurrenceResolution, 'id' | 'createdAt'>>(() =>
    emptyForm(user, id || '')
  );
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  // Acesso restrito
  const canAccess = ['Admin', 'Manager', 'Coordinator', 'Director'].includes(user.role);

  useEffect(() => {
    if (!canAccess) navigate(-1);
  }, [canAccess]);

  if (!occurrence || !student) {
    return (
      <Layout title="ERRO">
        <div className="p-8 text-center">
          <p className="text-gray-500">Ocorrência não encontrada.</p>
        </div>
      </Layout>
    );
  }

  const openNew = () => {
    setForm(emptyForm(user, id || ''));
    setEditingId(null);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const openEdit = (r: OccurrenceResolution) => {
    setForm({
      idOcorrencia: r.idOcorrencia,
      idFunc: r.idFunc,
      nomeResponsavel: r.nomeResponsavel,
      statusOcorrencia: r.statusOcorrencia,
      dataAtendimento: r.dataAtendimento.slice(0, 16),
      tiposIntervencao: [...r.tiposIntervencao],
      relatoResolucao: r.relatoResolucao || '',
      combinadosMetas: r.combinadosMetas || '',
      necessitaMonitoramento: r.necessitaMonitoramento,
      tempoMonitoramento: r.tempoMonitoramento || '',
      parecerGestao: r.parecerGestao || '',
      encaminhamentoExterno: [...r.encaminhamentoExterno],
      resultadoFinal: r.resultadoFinal,
      dataProximoFeedback: r.dataProximoFeedback || '',
      cienciaAluno: r.cienciaAluno,
      cienciaFamilia: r.cienciaFamilia,
      urlDocumentos: r.urlDocumentos || '',
    });
    setEditingId(r.id);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.nomeResponsavel || !form.statusOcorrencia || !form.dataAtendimento) {
      notify?.('Preencha os campos obrigatórios: Responsável, Status e Data de Atendimento.', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await onUpdateResolution({ ...form, id: editingId, createdAt: '' });
      } else {
        await onCreateResolution(form);
      }
      setShowForm(false);
      setEditingId(null);
      notify?.('Resolução salva com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      notify?.('Erro ao salvar a resolução.', 'error');
    } finally {

      setSaving(false);
    }
  };

  const handleDelete = async (resId: string) => {
    try {
      await onDeleteResolution(resId);
      setShowDeleteModal(null);
      notify?.('Registro excluído!', 'success');
    } catch {
      notify?.('Erro ao excluir.', 'error');
    }

  };

  const toggleCheck = (field: 'tiposIntervencao' | 'encaminhamentoExterno', value: string) => {
    setForm(prev => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value],
      };
    });
  };

  const headerTitle = (
    <div className="flex flex-col items-center leading-none">
      <span className="text-lg sm:text-xl font-black tracking-tighter uppercase mb-0.5">RESOLUÇÃO</span>
      <span className="text-[9px] sm:text-[10px] font-bold opacity-70 tracking-widest uppercase">Ocorrência</span>
    </div>
  );

  // Última resolução para o badge de status no topo
  const latestResolution = history[0];

  return (
    <Layout title={headerTitle} showBack={false}>
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24">

        {/* Card do aluno / ocorrência */}
        <div
          onClick={() => navigate(`/occurrences/${occurrence.id}`)}
          className="flex items-center gap-4 p-4 bg-[#3b5998]/5 rounded-2xl border border-[#3b5998]/10 cursor-pointer active:bg-[#3b5998]/10 transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-[#3b5998]/10 flex items-center justify-center text-[#3b5998] shrink-0">
            <FileText size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{occurrence.category} · {new Date(occurrence.date).toLocaleDateString('pt-BR')}</p>
            <h3 className="font-black text-[#3b5998] truncate uppercase text-sm leading-tight">{occurrence.title}</h3>
            <p className="text-xs text-gray-500 font-semibold truncate mt-0.5">{student.name} — {student.grade}</p>
          </div>
          <ChevronRight className="text-[#3b5998] shrink-0" size={18} />
        </div>

        {/* Status geral + botão novo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[#3b5998]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {history.length > 0 ? `${history.length} registro${history.length > 1 ? 's' : ''}` : 'Sem intervenções'}
            </span>
            {latestResolution && (
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${STATUS_COLORS[latestResolution.statusOcorrencia] || 'bg-gray-100 text-gray-500'}`}>
                {latestResolution.statusOcorrencia}
              </span>
            )}
          </div>
          {!showForm && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-[#3b5998] text-white px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md shadow-[#3b5998]/20 hover:bg-[#2d4373] active:scale-95 transition-all"
            >
              <Plus size={14} />
              Nova Intervenção
            </button>
          )}
        </div>

        {/* ─── FORMULÁRIO ─── */}
        {showForm && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-[#3b5998] to-blue-400" />
            <div className="p-6 space-y-8">

              {/* Header do form */}
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-gray-800 uppercase tracking-tight">
                  {editingId ? 'Editar Intervenção' : 'Nova Intervenção'}
                </h2>
                <button onClick={cancelForm} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* ── SEÇÃO 1: Identificação ── */}
              <div className="space-y-4">

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Status da Ocorrência *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Em andamento', 'Resolvido', 'Encaminhado', 'Cancelado'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, statusOcorrencia: s }))}
                        className={`px-3 py-3 rounded-xl border font-black uppercase text-[10px] tracking-wide transition-all active:scale-95 ${form.statusOcorrencia === s
                          ? 'bg-[#3b5998] text-white border-[#3b5998] shadow-md shadow-[#3b5998]/20'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#3b5998]/30'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data e Hora do Atendimento *</label>
                  <input
                    type="datetime-local"
                    value={form.dataAtendimento}
                    onChange={e => setForm(prev => ({ ...prev, dataAtendimento: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition"
                  />
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Responsável pela Resposta *</label>
                  <input
                    type="text"
                    value={form.nomeResponsavel}
                    onChange={e => setForm(prev => ({ ...prev, nomeResponsavel: e.target.value }))}
                    placeholder="Nome do orientador, coordenador ou gestor"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition"
                  />
                </div>
              </div>

              <div className="border-t border-gray-50" />

              {/* ── SEÇÃO 2: Ações Tomadas ── */}
              <div className="space-y-3">
                <SectionHeader icon={<ClipboardList size={16} />} title="Ações Tomadas" subtitle="Marque os tipos de intervenção realizados" />
                <div className="space-y-2">
                  {TIPOS_INTERVENCAO.map(t => (
                    <CheckItem
                      key={t}
                      label={t}
                      checked={form.tiposIntervencao.includes(t)}
                      onChange={() => toggleCheck('tiposIntervencao', t)}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-50" />

              {/* ── SEÇÃO 3: Detalhamento ── */}
              <div className="space-y-4">

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Relato da Resolução</label>
                  <textarea
                    rows={4}
                    value={form.relatoResolucao}
                    onChange={e => setForm(prev => ({ ...prev, relatoResolucao: e.target.value }))}
                    placeholder="Descreva como foi a conversa e qual foi a postura do aluno/família..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Combinados e Metas</label>
                  <textarea
                    rows={3}
                    value={form.combinadosMetas}
                    onChange={e => setForm(prev => ({ ...prev, combinadosMetas: e.target.value }))}
                    placeholder="O que o aluno se comprometeu a mudar ou cumprir após esse episódio..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition resize-none leading-relaxed"
                  />
                </div>

                {/* Monitoramento */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Necessidade de Monitoramento</label>
                  <div className="flex gap-3 mb-3">
                    {[true, false].map(v => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, necessitaMonitoramento: v }))}
                        className={`flex-1 py-3 rounded-xl border font-black uppercase text-[10px] tracking-wide transition-all active:scale-95 ${form.necessitaMonitoramento === v
                          ? 'bg-[#3b5998] text-white border-[#3b5998] shadow-md shadow-[#3b5998]/20'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#3b5998]/30'
                          }`}
                      >
                        {v ? 'Sim' : 'Não'}
                      </button>
                    ))}
                  </div>
                  {form.necessitaMonitoramento && (
                    <input
                      type="text"
                      value={form.tempoMonitoramento}
                      onChange={e => setForm(prev => ({ ...prev, tempoMonitoramento: e.target.value }))}
                      placeholder="Ex: 30 dias, 2 semanas..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition"
                    />
                  )}
                </div>
              </div>

              <div className="border-t border-gray-50" />

              {/* ── SEÇÃO 4: Formalização ── */}
              <div className="space-y-4">


                {/* Parecer */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Parecer da Gestão</label>
                  <textarea
                    rows={4}
                    value={form.parecerGestao}
                    onChange={e => setForm(prev => ({ ...prev, parecerGestao: e.target.value }))}
                    placeholder="Relatando a solução adotada pela gestão escolar..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition resize-none leading-relaxed"
                  />
                </div>

                {/* Encaminhamentos Externos */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Encaminhamento Externo (PMSP/SGP)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ENCAMINHAMENTOS_EXTERNOS.map(e => (
                      <CheckItem
                        key={e}
                        label={e}
                        checked={form.encaminhamentoExterno.includes(e)}
                        onChange={() => toggleCheck('encaminhamentoExterno', e)}
                      />
                    ))}
                  </div>
                </div>

                {/* Resultado Final */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Resultado Final</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Conciliado', 'Penalidade Aplicada', 'Em acompanhamento'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm(prev => ({
                          ...prev,
                          resultadoFinal: prev.resultadoFinal === r ? undefined : r
                        }))}
                        className={`py-3 px-2 rounded-xl border font-black uppercase text-[9px] tracking-wide transition-all active:scale-95 leading-snug ${form.resultadoFinal === r
                          ? 'bg-[#3b5998] text-white border-[#3b5998] shadow-md shadow-[#3b5998]/20'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-[#3b5998]/30'
                          }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data próximo feedback */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Data do Próximo Feedback</label>
                  <input
                    type="date"
                    value={form.dataProximoFeedback}
                    onChange={e => setForm(prev => ({ ...prev, dataProximoFeedback: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition"
                  />
                </div>

                {/* Ciência */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ciência dos Envolvidos</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, cienciaAluno: !prev.cienciaAluno }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-black uppercase text-[10px] tracking-wide transition-all active:scale-95 ${form.cienciaAluno
                        ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                        }`}
                    >
                      {form.cienciaAluno ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      Aluno
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, cienciaFamilia: !prev.cienciaFamilia }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-black uppercase text-[10px] tracking-wide transition-all active:scale-95 ${form.cienciaFamilia
                        ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-green-300'
                        }`}
                    >
                      {form.cienciaFamilia ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      Família
                    </button>
                  </div>
                </div>

                {/* URL Documentos */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Link de Documentos (ata, termo, etc.)</label>
                  <input
                    type="url"
                    value={form.urlDocumentos}
                    onChange={e => setForm(prev => ({ ...prev, urlDocumentos: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3b5998]/30 focus:border-[#3b5998]/50 transition"
                  />
                  <p className="text-[10px] text-gray-400 font-semibold mt-1.5">Cole o link do Google Drive, OneDrive ou sistema escolar.</p>
                </div>
              </div>

              {/* Botão Salvar */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-5 bg-[#3b5998] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-[#3b5998]/25 hover:bg-[#2d4373] active:scale-95 transition-all border-b-4 border-[#2d4373] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                {saving ? 'Salvando...' : editingId ? 'Atualizar Registro' : 'Salvar Intervenção'}
              </button>

              {/* Cancelar */}
              <button
                onClick={cancelForm}
                className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ─── HISTÓRICO ─── */}
        {history.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Clock size={12} />
              Histórico de Intervenções
            </div>
            {history.map(r => (
              <HistoryCard
                key={r.id}
                resolution={r}
                canDelete={['Admin', 'Manager', 'Director'].includes(user.role)}
                onDelete={() => setShowDeleteModal(r.id)}
                onEdit={() => openEdit(r)}
              />
            ))}
          </div>
        ) : !showForm ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
              <ClipboardList size={36} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Sem registros</p>
              <p className="text-xs text-gray-300 font-medium mt-1">Nenhuma intervenção registrada para esta ocorrência ainda.</p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-[#3b5998] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-md shadow-[#3b5998]/20 hover:bg-[#2d4373] active:scale-95 transition-all"
            >
              <Plus size={14} />
              Registrar Primeira Intervenção
            </button>
          </div>
        ) : null}

        {/* Botão Voltar */}
        <button
          onClick={() => navigate(`/occurrences/${occurrence.id}`)}
          className="w-full py-4 bg-gray-100 text-gray-400 rounded-3xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <ChevronRight size={18} className="rotate-180" />
          Voltar para a Ocorrência
        </button>
      </div>

      {/* Modal Confirmar Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Excluir Registro</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Tem certeza que deseja apagar este registro de intervenção? Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col w-full gap-3 pt-4">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="w-full py-5 bg-red-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all border-b-4 border-red-700"
                >
                  Sim, Excluir
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="w-full py-5 bg-gray-100 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OccurrenceResolutionPage;
