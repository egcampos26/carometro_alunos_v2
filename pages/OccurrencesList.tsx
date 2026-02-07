
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Occurrence, Student, AuthUser } from '../types';
import { Search, User, Clock, FileText, LayoutList, Plus, Calendar, X, EyeOff } from 'lucide-react';

interface OccurrencesListProps {
  students: Student[];
  occurrences: Occurrence[];
  user: AuthUser;
  onToggleRole: () => void;
}

const OccurrencesList: React.FC<OccurrencesListProps> = ({ students, occurrences, user, onToggleRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const navigate = useNavigate();

  const getStudentById = (id: string) => students.find(s => s.id === id);

  const hasSearch = searchTerm.trim().length > 0;
  const hasDateFilter = filterDate !== '';

  const filtered = (hasSearch || hasDateFilter)
    ? occurrences.filter(occ => {
      const student = getStudentById(occ.studentId);
      const sName = student?.name.toLowerCase() || '';
      const sRA = student?.registrationNumber.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      const matchesText = !hasSearch || (
        sName.includes(search) ||
        sRA.includes(search) ||
        occ.title.toLowerCase().includes(search)
      );

      const matchesDate = !hasDateFilter || occ.date === filterDate;

      return matchesText && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const handleAddNew = () => {
    navigate('/occurrences/new-multi');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDate('');
  };

  const headerTitle = (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-xl sm:text-3xl font-black tracking-tighter uppercase mb-0.5">OCORRÊNCIAS</span>
      <span className="text-xs sm:text-sm font-bold opacity-80 tracking-widest uppercase">HISTÓRICO GERAL</span>
    </div>
  );

  return (
    <Layout
      title={headerTitle}
      user={user}
      onToggleRole={onToggleRole}
      rightAction={
        <button
          onClick={handleAddNew}
          className="w-10 h-10 flex items-center justify-center bg-white text-[#3b5998] rounded-full hover:bg-gray-100 transition-colors shadow-sm active:scale-90"
          title="Novo Registro Coletivo"
        >
          <Plus size={20} />
        </button>
      }
    >
      <div className="p-4 sm:p-8 max-w-6xl 2xl:max-w-7xl mx-auto w-full">
        {/* Filtros Container - Ajustado para w-full para alinhar com a busca centralizada */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 w-full">
          {/* Busca por Texto - flex-1 garante que ocupe o máximo de espaço */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nome, RA ou Título..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5998]" size={20} />
          </div>

          {/* Filtro de Data */}
          <div className="relative w-full md:w-64">
            <input
              type="date"
              className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm font-bold text-[#3b5998] transition-all appearance-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5998]" size={20} />
            {hasDateFilter && (
              <button
                onClick={() => setFilterDate('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Grid for Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {!(hasSearch || hasDateFilter) ? (
            <div className="col-span-full text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 px-6">
              <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <LayoutList size={32} className="text-[#3b5998] opacity-50" />
              </div>
              <h3 className="text-gray-800 font-black mb-2 uppercase text-sm tracking-widest">Busca Centralizada</h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto font-bold uppercase tracking-tighter">
                Utilize os filtros acima para pesquisar registros por aluno, assunto ou data específica.
              </p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map(occ => {
              const student = getStudentById(occ.studentId);
              return (
                <div
                  key={occ.id}
                  className="bg-white p-5 rounded-2xl border-2 border-gray-50 shadow-sm hover:border-[#3b5998]/20 hover:shadow-md transition-all flex gap-5 cursor-pointer group"
                  onClick={() => navigate(`/occurrences/${occ.id}`, { state: { from: 'list' } })}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gray-50 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                    {student?.photoUrl ? (
                      <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-black text-white px-3 py-1 rounded-full uppercase shadow-sm ${occ.category === 'Comportamental' ? 'bg-red-500' :
                        occ.category === 'Acadêmica' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}>
                        {occ.category}
                      </span>
                      {occ.isConfidential && (
                        <div className="bg-red-50 text-red-500 p-1 rounded-full border border-red-100" title="Ocorrência Sigilosa">
                          <EyeOff size={10} />
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                        <Clock size={12} />
                        {new Date(occ.date).toLocaleDateString()}
                      </div>
                    </div>
                    <h4 className="font-black text-gray-900 text-base mb-1 truncate uppercase tracking-tighter">{occ.title}</h4>
                    <p className="text-[11px] text-[#3b5998] font-black uppercase truncate mb-2">{student?.name || 'Aluno Desconhecido'}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-gray-300" />
                        <span className="text-[10px] text-gray-400 font-black">RA: {student?.registrationNumber}</span>
                      </div>
                      <span className="text-[9px] text-gray-300 font-bold uppercase">Ref: {occ.registeredBy}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <Search size={32} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum resultado encontrado</p>
              <button onClick={clearFilters} className="mt-4 text-[#3b5998] text-[10px] font-black uppercase tracking-widest hover:underline">Limpar todos os filtros</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OccurrencesList;
