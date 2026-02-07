
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { LogEntry } from '../types';
import { Activity, Calendar, Search, X, Clock, User, Info, FileText, ChevronRight } from 'lucide-react';

interface SystemLogProps {
  logs: LogEntry[];
}

const SystemLog: React.FC<SystemLogProps> = ({ logs }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filteredLogs = logs.filter(log => {
    const logDate = log.timestamp.split('T')[0];
    const matchesStart = startDate === '' || logDate >= startDate;
    const matchesEnd = endDate === '' || logDate <= endDate;
    const matchesSearch = searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStart && matchesEnd && matchesSearch;
  });

  const headerTitle = (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-xl sm:text-3xl font-black tracking-tighter uppercase mb-0.5">LOG DO SISTEMA</span>
      <span className="text-xs sm:text-sm font-bold opacity-80 tracking-widest uppercase">HISTÓRICO DE ATIVIDADES</span>
    </div>
  );

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <Layout title={headerTitle}>
      <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full pb-24">

        {/* Filtros Container */}
        <div className="bg-white p-6 rounded-[32px] border-2 border-gray-50 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca por Texto */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar ação, usuário..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm font-medium transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>

            {/* Data Inicial */}
            <div className="relative">
              <input
                type="date"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm font-bold text-[#3b5998] transition-all text-sm appearance-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5998]" size={18} />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase pointer-events-none">Início</div>
            </div>

            {/* Data Final */}
            <div className="relative">
              <input
                type="date"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm font-bold text-[#3b5998] transition-all text-sm appearance-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5998]" size={18} />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase pointer-events-none">Fim</div>
            </div>
          </div>

          {(startDate || endDate || searchTerm) && (
            <div className="flex justify-end">
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setSearchTerm(''); }}
                className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest hover:underline"
              >
                <X size={14} /> Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de Logs */}
        <div className="space-y-4">
          {filteredLogs.length > 0 ? (
            filteredLogs.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedLog(log)}
                role="button"
                tabIndex={0}
                className="bg-white p-5 rounded-[24px] border-2 border-gray-50 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-[#3b5998]/20 hover:shadow-md transition-all cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:ring-offset-2"
              >
                {/* Linha lateral de destaque no hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#3b5998] opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Badge de Data/Hora */}
                <div className="flex flex-col items-center justify-center bg-gray-50 px-4 py-3 rounded-2xl shrink-0 sm:w-28 group-hover:bg-blue-50 transition-colors">
                  <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1 group-hover:text-blue-400">{formatDate(log.timestamp)}</span>
                  <div className="flex items-center gap-1 text-[#3b5998] font-black text-sm">
                    <Clock size={12} />
                    {formatTime(log.timestamp).substring(0, 5)}
                  </div>
                </div>

                {/* Conteúdo do Log */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#3b5998]" />
                    <h4 className="font-black text-gray-900 text-sm uppercase tracking-tight truncate group-hover:text-[#3b5998] transition-colors">{log.action}</h4>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed truncate">{log.details.split('\n')[0]}</p>
                </div>

                {/* Rodapé do Item (Mobile) / Lado Direito (Desktop) */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100">
                    <User size={12} className="text-[#3b5998]" />
                    <span className="text-[9px] font-black text-[#3b5998] uppercase tracking-tighter">{log.user}</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-[#3b5998] group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
              <Info className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Nenhuma atividade registrada no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Cabeçalho do Modal */}
            <div className="bg-[#3b5998] p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm">Protocolo de Atividade</h3>
                  <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Ref: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data</span>
                  <div className="flex items-center gap-2 font-black text-gray-800 text-sm">
                    <Calendar size={14} className="text-[#3b5998]" />
                    {formatDate(selectedLog.timestamp)}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Hora</span>
                  <div className="flex items-center gap-2 font-black text-gray-800 text-sm">
                    <Clock size={14} className="text-[#3b5998]" />
                    {formatTime(selectedLog.timestamp)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black text-[#3b5998] uppercase tracking-widest ml-1">Responsável</span>
                <div className="flex items-center gap-3 p-4 bg-blue-50/30 border border-blue-100 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#3b5998] shadow-sm border border-blue-50">
                    <User size={20} />
                  </div>
                  <span className="font-black text-gray-800 uppercase text-sm">{selectedLog.user}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black text-[#3b5998] uppercase tracking-widest ml-1">Ação</span>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#3b5998] shadow-sm">
                    <FileText size={20} />
                  </div>
                  <span className="font-black text-gray-800 uppercase text-sm tracking-tight">{selectedLog.action}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-black text-[#3b5998] uppercase tracking-widest ml-1">Relatório de Modificações</span>
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden shadow-inner">
                  <div className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap break-words">
                    {selectedLog.details}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-5 bg-[#3b5998] text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all mt-4 border-b-4 border-blue-900"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SystemLog;
