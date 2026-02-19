
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Occurrence, AuthUser } from '../types';
import { UserCheck, Calendar, Search, Users, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

interface OccurrenceAddProps {
  students: Student[];
  onAddOccurrence: (occ: Occurrence) => void;
  user: AuthUser;
  onToggleRole: () => void;
}

const OccurrenceAdd: React.FC<OccurrenceAddProps> = ({ students, onAddOccurrence, user, onToggleRole }) => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const initialStudent = students.find(s => s.id === studentId);

  const today = new Date().toISOString().split('T')[0];

  const [selectedIds, setSelectedIds] = useState<string[]>(studentId ? [studentId] : []);
  const [studentSearch, setStudentSearch] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState<Occurrence['category']>('Comportamental');
  const [isConfidential, setIsConfidential] = useState(false);

  if (!initialStudent) return <div>Aluno não encontrado</div>;

  const filteredStudents = studentSearch.trim() === ''
    ? []
    : students.filter(s =>
      (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase())) &&
      !selectedIds.includes(s.id) // Não mostrar quem já foi selecionado
    ).slice(0, 5);

  const toggleAdditionalStudent = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setStudentSearch('');
  };

  const getStudent = (id: string) => students.find(s => s.id === id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !title || !description || !date) return;

    // Se houver mais de um aluno, criamos um groupId para vinculá-los
    const groupId = selectedIds.length > 1 ? `group-${Date.now()}` : undefined;

    selectedIds.forEach((id, index) => {
      const newOcc: Occurrence = {
        id: (Date.now() + index).toString(),
        studentId: id,
        groupId,
        date: date,
        title,
        description,
        category,
        nomeFunc: user.name,
        idFunc: user.idFunc,
        isConfidential
      };
      onAddOccurrence(newOcc);
    });

    navigate(`/student/${initialStudent.id}`, { replace: true });
  };

  const headerTitle = (
    <div className="flex flex-col items-center justify-center leading-tight">
      <span className="text-sm sm:text-3xl font-black tracking-tighter uppercase">REGISTRO DE OCORRÊNCIA</span>
    </div>
  );

  return (
    <Layout title={headerTitle} showBack={false}>
      <div className="p-6 max-w-4xl mx-auto pb-20">
        {/* Aluno Principal */}
        <div className="mb-6 flex items-center gap-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
          <img src={initialStudent.photoUrl || NO_IMAGE_RIGHTS_URL} className="w-16 h-16 rounded-xl object-cover shadow-sm border-2 border-white" alt="" />
          <div>
            <h3 className="font-black text-[#3b5998] uppercase text-sm leading-tight">{initialStudent.name}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{initialStudent.grade} • {initialStudent.shift}</p>
          </div>
          <div className="ml-auto">
            <span className="text-[9px] font-black bg-[#3b5998] text-white px-2 py-1 rounded-md uppercase">Principal</span>
          </div>
        </div>

        {/* Seleção de Alunos Adicionais */}
        <div className="mb-10 p-5 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 space-y-4">
          <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1 flex items-center gap-2">
            <Users size={16} /> Acrescentar mais alunos a este registro?
          </label>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Buscar aluno por nome ou RA..."
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#3b5998] outline-none font-bold text-gray-700 transition-all text-sm"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />

            {filteredStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-40">
                {filteredStudents.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleAdditionalStudent(s.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <img src={s.photoUrl || NO_IMAGE_RIGHTS_URL} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    <div className="text-left">
                      <p className="text-xs font-black text-gray-800 uppercase leading-none">{s.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{s.grade} • RA: {s.registrationNumber}</p>
                    </div>
                    <CheckCircle2 size={18} className="ml-auto text-gray-200" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chips dos selecionados (além do principal) */}
          {selectedIds.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedIds.map(id => {
                if (id === studentId) return null; // Não remove o principal aqui
                const s = getStudent(id);
                if (!s) return null;
                return (
                  <div key={id} className="flex items-center gap-2 bg-blue-50 text-[#3b5998] pl-2 pr-1 py-1 rounded-full border border-blue-100 animate-in fade-in zoom-in duration-200">
                    <span className="text-[10px] font-black uppercase truncate max-w-[120px]">{s.name.split(' ')[0]}</span>
                    <button
                      type="button"
                      onClick={() => toggleAdditionalStudent(id)}
                      className="w-5 h-5 bg-white rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Data da Ocorrência</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#3b5998] outline-none font-bold text-gray-700 transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Registrado por</label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-500 font-bold">
                <UserCheck size={18} className="text-[#3b5998]" />
                <span className="text-sm">{user.name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Categoria</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Comportamental', 'Acadêmica', 'Médica', 'Outros'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat as Occurrence['category'])}
                  className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-tight border-2 transition-all shadow-sm ${category === cat
                    ? 'bg-[#3b5998] border-[#3b5998] text-white'
                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Sigiloso */}
          <div className="space-y-3">
            <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Privacidade</label>
            <button
              type="button"
              onClick={() => setIsConfidential(!isConfidential)}
              className={`w-full p-4 rounded-2xl border-2 transition-all shadow-sm flex items-center justify-between ${isConfidential
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'
                }`}
            >
              <div className="flex items-center gap-3">
                {isConfidential ? <EyeOff size={20} /> : <Eye size={20} />}
                <div className="text-left">
                  <p className="text-sm font-black uppercase">
                    {isConfidential ? 'Ocorrência Sigilosa' : 'Ocorrência Normal'}
                  </p>
                  <p className="text-[10px] font-bold opacity-70 mt-0.5">
                    {isConfidential
                      ? 'Apenas administradores podem visualizar'
                      : 'Visível para todos os educadores'}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-all relative ${isConfidential ? 'bg-red-500' : 'bg-gray-300'
                }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${isConfidential ? 'right-0.5' : 'left-0.5'
                  }`} />
              </div>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Assunto / Título</label>
            <input
              type="text"
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#3b5998] outline-none font-bold text-gray-800 transition-all"
              placeholder="Ex: Falta de material, Conflito, Elogio..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Relato Detalhado</label>
            <textarea
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#3b5998] outline-none min-h-[180px] font-medium text-gray-700 leading-relaxed transition-all"
              placeholder="Descreva o ocorrido com o máximo de detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 text-gray-500 py-4 sm:py-5 rounded-3xl font-black uppercase hover:bg-gray-200 active:scale-95 transition-all text-sm tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] bg-[#3b5998] text-white py-4 sm:py-5 rounded-3xl font-black uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base tracking-widest border-b-4 border-blue-900 px-2"
            >
              Confirmar Ocorrência ({selectedIds.length} {selectedIds.length === 1 ? 'ALUNO' : 'ALUNOS'})
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default OccurrenceAdd;
