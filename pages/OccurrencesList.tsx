
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Occurrence, Student, AuthUser } from '../types';
import { Search, User, Clock, FileText, LayoutList, Plus, Calendar, X, EyeOff, ShieldAlert } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

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

  // Filtra por role SEMPRE (independente de busca)
  const visibleOccurrences = occurrences.filter(occ => {
    // User/Editor: só veem as próprias. Os demais veem todas.
    if (user.role === 'User' || user.role === 'Editor') return occ.nomeFunc === user.name;
    return true;
  });

  // Aplica filtros de texto/data sobre as ocorrências visíveis
  const filtered = visibleOccurrences.filter(occ => {
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
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
      showBack={false}
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
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Nome, RA ou Título..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5998]" size={20} />
            {hasSearch && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

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

        {/* Contador */}
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
          {filtered.length} {filtered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          {(hasSearch || hasDateFilter) && (
            <button onClick={clearFilters} className="ml-3 text-[#3b5998] hover:underline">
              Limpar filtros
            </button>
          )}
        </p>

        {/* Grid de Resultados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {filtered.length > 0 ? (
            filtered.map(occ => {
              const student = getStudentById(occ.studentId);
              return (
                <div
                  key={occ.id}
                  className="bg-white p-4 rounded-2xl border-2 border-gray-50 shadow-sm hover:border-[#3b5998]/20 hover:shadow-md transition-all flex gap-4 cursor-pointer group"
                  onClick={() => navigate(`/occurrences/${occ.id}`, { state: { from: 'list' } })}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-50 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                    {student ? (
                      <img
                        src={student.imageRightsSigned === 'Sim' ? student.photoUrl : NO_IMAGE_RIGHTS_URL}
                        alt={student.name}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${student.imageRightsSigned !== 'Sim' ? 'grayscale opacity-60' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <User size={28} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase shadow-sm ${occ.category === 'Comportamental' ? 'bg-red-500' :
                          occ.category === 'Pedagógica' ? 'bg-blue-500' : 'bg-orange-500'
                          }`}>
                          {occ.category}
                        </span>
                        {occ.tipoViolencia && (
                          <span className="text-red-600 text-[11px] font-black uppercase tracking-tighter flex items-center gap-1">
                            ⚠ {occ.tipoViolencia}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1.5">
                          {occ.isConfidential && (
                            <EyeOff size={10} className="text-red-500" />
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                            <Clock size={10} />
                            {new Date(occ.date).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-[8px] text-gray-300 font-bold uppercase leading-none tracking-tighter mt-0.5">Ref: {occ.nomeFunc}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#3b5998] font-black uppercase truncate leading-none">{student?.name || 'Aluno Desconhecido'}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100 px-6">
              <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <LayoutList size={32} className="text-[#3b5998] opacity-50" />
              </div>
              <h3 className="text-gray-800 font-black mb-2 uppercase text-sm tracking-widest">
                {(hasSearch || hasDateFilter) ? 'Nenhum resultado' : 'Sem registros'}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto font-bold uppercase tracking-tighter">
                {(hasSearch || hasDateFilter)
                  ? 'Nenhuma ocorrência corresponde aos filtros aplicados.'
                  : 'Ainda não há ocorrências registradas.'}
              </p>
              {(hasSearch || hasDateFilter) && (
                <button onClick={clearFilters} className="mt-4 text-[#3b5998] text-[10px] font-black uppercase tracking-widest hover:underline">
                  Limpar todos os filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default OccurrencesList;
