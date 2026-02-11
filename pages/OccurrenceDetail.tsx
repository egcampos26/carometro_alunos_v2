
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Occurrence, AuthUser } from '../types';
import { User, Clock, ChevronRight, Users, Trash2, AlertCircle, Edit3, X, AlertTriangle, EyeOff } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

interface OccurrenceDetailProps {
  students: Student[];
  occurrences: Occurrence[];
  user: AuthUser;
  onDelete: (id: string) => void;
}

const OccurrenceDetail: React.FC<OccurrenceDetailProps> = ({ students, occurrences, user, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const occurrence = occurrences.find(o => o.id === id);
  const student = occurrence ? students.find(s => s.id === occurrence.studentId) : null;

  // Encontra outros alunos se for uma ocorrência coletiva
  const involvedStudents = occurrence?.groupId
    ? occurrences
      .filter(o => o.groupId === occurrence.groupId)
      .map(o => students.find(s => s.id === o.studentId))
      .filter((s): s is Student => !!s)
    : [];

  involvedStudents.sort((a, b) => a.name.localeCompare(b.name));

  if (!occurrence || !student) {
    return (
      <Layout title="ERRO">
        <div className="p-8 text-center">
          <p className="text-gray-500">Ocorrência não encontrada.</p>
        </div>
      </Layout>
    );
  }

  // Permissão: Admin ou o próprio autor do registro
  const canModify = user.role === 'Admin' || occurrence.registeredBy === user.name;

  const confirmDelete = () => {
    const idToDelete = occurrence.id;
    navigate(-1);
    // Pequeno timeout para garantir que a navegação iniciou antes do state update
    setTimeout(() => {
      onDelete(idToDelete);
    }, 50);
  };

  const headerTitle = (
    <div className="flex flex-col items-center leading-none">
      <span className="text-lg sm:text-xl font-black tracking-tighter uppercase mb-0.5">DETALHE</span>
      <span className="text-[9px] sm:text-[10px] font-bold opacity-70 tracking-widest uppercase">OCORRÊNCIA</span>
    </div>
  );

  return (
    <Layout title={headerTitle}>
      <div className="p-6 space-y-6 max-w-4xl mx-auto pb-20">
        <div
          onClick={() => navigate(`/student/${student.id}`)}
          className="flex items-center gap-4 p-4 bg-[#3b5998]/5 rounded-xl border border-[#3b5998]/10 active:bg-[#3b5998]/10 transition-colors cursor-pointer"
        >
          <div className="w-16 h-16 shrink-0 bg-white rounded-lg overflow-hidden border-2 border-white shadow-sm">
            <img
              src={student.imageRightsSigned === 'Sim' ? student.photoUrl : NO_IMAGE_RIGHTS_URL}
              alt={student.name}
              className={`w-full h-full object-cover ${student.imageRightsSigned !== 'Sim' ? 'grayscale opacity-60' : ''}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#3b5998] truncate uppercase text-sm leading-tight">{student.name}</h3>
            <p className="text-xs text-gray-500 font-bold uppercase">{student.grade} • {student.shift}</p>
          </div>
          <ChevronRight className="text-[#3b5998]" size={20} />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className={`h-3 w-full ${occurrence.category === 'Comportamental' ? 'bg-red-500' :
            occurrence.category === 'Acadêmica' ? 'bg-blue-500' : 'bg-orange-500'
            }`} />

          <div className="p-6 sm:p-8 space-y-8">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
              <span className={`text-[10px] font-black text-white px-4 py-1.5 rounded-full uppercase shadow-sm ${occurrence.category === 'Comportamental' ? 'bg-red-500' :
                occurrence.category === 'Acadêmica' ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                {occurrence.category}
              </span>

              {occurrence.isConfidential && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full uppercase border border-red-100 mr-auto ml-3">
                  <EyeOff size={12} />
                  Sigiloso
                </span>
              )}
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                <Clock size={14} className="text-[#3b5998]" />
                {new Date(occurrence.date).toLocaleDateString('pt-BR')}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                {occurrence.title}
              </h2>

              <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 min-h-[120px]">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {occurrence.description}
                </p>
              </div>
            </div>

            {involvedStudents.length > 1 && (
              <div className="pt-6 border-t border-gray-50">
                <h4 className="text-[#3b5998] text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Users size={14} /> Alunos Envolvidos ({involvedStudents.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {involvedStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/student/${s.id}`)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-95 ${s.id === student.id
                        ? 'bg-[#3b5998] border-[#3b5998] text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-[#3b5998] hover:text-[#3b5998]'
                        }`}
                    >
                      <img
                        src={s.imageRightsSigned === 'Sim' ? s.photoUrl : NO_IMAGE_RIGHTS_URL}
                        className={`w-6 h-6 rounded-full object-cover ${s.imageRightsSigned !== 'Sim' ? 'grayscale opacity-60' : ''}`}
                        alt={s.name}
                      />
                      <span className="text-[10px] font-black uppercase whitespace-nowrap">{s.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-50 gap-4">
              <div className="flex items-center gap-4 self-start sm:self-auto">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#3b5998] border border-blue-100 shadow-sm">
                  <User size={22} />
                </div>
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase leading-none mb-1 tracking-widest">Registrado por</p>
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{occurrence.registeredBy}</p>
                </div>
              </div>

              {canModify && (
                <div className="flex flex-row w-full sm:w-auto gap-3">
                  <button
                    onClick={() => navigate(`/occurrences/${occurrence.id}/edit`, { state: location.state })}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 text-[#3b5998] px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-sm border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all"
                  >
                    <Edit3 size={16} />
                    Editar
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-sm border border-red-100 hover:bg-red-100 active:scale-95 transition-all"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              )}
            </div>

            {!canModify && (
              <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-400">
                <AlertCircle size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Apenas Administradores ou Autor podem alterar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Confirmar Exclusão</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Tem certeza que deseja apagar este registro de ocorrência? Esta ação não pode ser desfeita.
              </p>

              <div className="flex flex-col w-full gap-3 pt-6">
                <button
                  onClick={confirmDelete}
                  className="w-full py-5 bg-red-500 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all border-b-4 border-red-700"
                >
                  Sim, Excluir Registro
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
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

export default OccurrenceDetail;
