
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Occurrence, AuthUser } from '../types';
import { UserCheck, Calendar, Info, Clock, Save, X, Eye, EyeOff } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

interface OccurrenceEditProps {
  students: Student[];
  occurrences: Occurrence[];
  onUpdateOccurrence: (occ: Occurrence) => void;
  user: AuthUser;
}

const OccurrenceEdit: React.FC<OccurrenceEditProps> = ({ students, occurrences, onUpdateOccurrence, user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const occurrence = occurrences.find(o => o.id === id);
  const student = occurrence ? students.find(s => s.id === occurrence.studentId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<Occurrence['category']>('Comportamental');
  const [isConfidential, setIsConfidential] = useState(false);

  useEffect(() => {
    if (occurrence) {
      setTitle(occurrence.title);
      setDescription(occurrence.description);
      setDate(occurrence.date);
      setCategory(occurrence.category);
      setIsConfidential(occurrence.isConfidential || false);

      // Verificação de permissão
      const canEdit = user.role === 'Admin' || occurrence.registeredBy === user.name;
      if (!canEdit) {
        navigate(`/occurrences/${id}`, { replace: true });
      }
    }
  }, [occurrence, user, navigate, id]);

  if (!occurrence || !student) {
    return (
      <Layout title="ERRO">
        <div className="p-8 text-center">
          <p className="text-gray-500">Registro não encontrado.</p>
        </div>
      </Layout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) return;

    const updatedOcc: Occurrence = {
      ...occurrence,
      date,
      title,
      description,
      category,
      isConfidential
    };

    onUpdateOccurrence(updatedOcc);
    navigate(`/occurrences/${occurrence.id}`, { replace: true, state: location.state });
  };

  const headerTitle = (
    <div className="flex flex-col items-center justify-center leading-tight">
      <span className="text-xl sm:text-3xl font-black tracking-tighter uppercase">EDITAR OCORRÊNCIA</span>
    </div>
  );

  const hasImageRights = student.imageRightsSigned === 'Sim';
  const displayPhoto = hasImageRights ? student.photoUrl : NO_IMAGE_RIGHTS_URL;

  return (
    <Layout title={headerTitle} showBack={false}>
      <div className="p-6 max-w-4xl mx-auto pb-20">
        <div className="mb-8 flex items-center gap-4 p-5 bg-blue-50/30 rounded-3xl border border-blue-100/50">
          <img
            src={displayPhoto}
            className={`w-16 h-16 rounded-2xl object-cover shadow-sm border-2 border-white ${!hasImageRights ? 'grayscale opacity-60' : ''}`}
            alt={student.name}
          />
          <div>
            <h3 className="font-black text-[#3b5998] uppercase text-sm leading-tight">{student.name}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{student.grade} • RA: {student.registrationNumber}</p>
          </div>
          <div className="ml-auto hidden sm:block">
            <span className="text-[9px] font-black bg-[#3b5998]/10 text-[#3b5998] px-3 py-1.5 rounded-full border border-[#3b5998]/20 uppercase">Registro Original</span>
          </div>
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
              <label className="text-[#3b5998] text-xs sm:text-sm font-black uppercase tracking-widest ml-1">Autor do Registro</label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-400 font-bold italic">
                <UserCheck size={18} className="text-gray-300" />
                <span className="text-sm">{occurrence.registeredBy}</span>
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
                  onClick={() => setCategory(cat as any)}
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
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-[#3b5998] outline-none min-h-[220px] font-medium text-gray-700 leading-relaxed transition-all"
              placeholder="Descreva o ocorrido com o máximo de detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-row gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 text-gray-400 py-4 sm:py-5 rounded-3xl font-black uppercase hover:bg-gray-200 active:scale-95 transition-all text-sm tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] bg-[#3b5998] text-white py-4 sm:py-5 rounded-3xl font-black uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base tracking-widest border-b-4 border-blue-900 flex items-center justify-center gap-3"
            >
              <Save size={20} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default OccurrenceEdit;
