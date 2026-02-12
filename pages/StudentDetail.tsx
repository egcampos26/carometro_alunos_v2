
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Occurrence, AuthUser } from '../types';
import { Edit2, Phone, User, ChevronRight, CreditCard, ShieldAlert, Calendar, MapPin, Plus, Minus, EyeOff } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

interface StudentDetailProps {
  students: Student[];
  occurrences: Occurrence[];
  user: AuthUser;
  onToggleRole: () => void;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ students, occurrences, user, onToggleRole }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const isAdmin = user.role === 'Admin' || user.role === 'Manager' || user.role === 'Editor';

  const student = students.find(s => s.id === id);
  const studentOccurrences = occurrences
    .filter(o => {
      if (o.studentId !== id) return false;
      if (user.role === 'User' || user.role === 'Editor') return o.registeredBy === user.name;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!student) return <div>Aluno não encontrado</div>;
  const displayPhoto = student.imageRightsSigned === 'Sim' ? student.photoUrl : NO_IMAGE_RIGHTS_URL;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAdmin) {
      navigate(`/student/${student.id}/edit`, { replace: true });
    }
  };

  const headerTitle = (
    <div className="flex flex-col items-center leading-tight">
      <span className="text-xl sm:text-3xl font-black tracking-tighter uppercase">PERFIL DO ALUNO</span>
    </div>
  );

  const hasAdditionalPhones = student.telefone3 || student.telefone4;

  // Componente extraído para evitar repetição (RA Box)
  const AcademicRecordBox = () => (
    <div className="w-full max-w-[320px] lg:max-w-none bg-blue-50/50 p-6 rounded-3xl border-2 border-blue-50 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="flex flex-row items-center justify-center gap-2 mb-4">
        <CreditCard className="text-[#3b5998]" size={16} />
        <span className="text-[#3b5998] text-[9px] font-black uppercase tracking-widest">REGISTRO ACADÊMICO</span>
      </div>
      <div className="space-y-3 w-full">
        <p className="font-black text-xl text-[#3b5998] tracking-tight leading-none uppercase">RA: {student.registrationNumber}</p>
        <p className="font-black text-lg text-[#3b5998]/60 tracking-tight uppercase leading-none">RGA: {student.rga}</p>
      </div>
    </div>
  );

  return (
    <Layout
      title={headerTitle}
      user={user}
      onToggleRole={onToggleRole}
      leftAction={null}
      onBack={() => navigate(`/carometro/${student.shift}/${student.grade}`)}
      rightAction={
        isAdmin ? (
          <button
            onClick={handleEdit}
            className="w-10 h-10 flex items-center justify-center bg-white text-[#3b5998] rounded-full hover:bg-gray-100 transition-colors shadow-sm active:scale-90"
            title="Editar Aluno"
          >
            <Edit2 size={18} />
          </button>
        ) : null
      }
    >
      <div className="max-w-6xl 2xl:max-w-7xl mx-auto p-4 sm:p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
          <div className="flex flex-col items-center lg:w-1/3 space-y-8">
            <div className="w-full max-w-[320px] lg:max-w-none">
              <div className="aspect-[3/4] bg-gray-50 rounded-3xl overflow-hidden shadow-2xl border-8 border-white relative">
                <img src={displayPhoto} alt={student.name} className={`w-full h-full object-cover ${student.imageRightsSigned !== 'Sim' ? 'grayscale opacity-70' : ''}`} />
                {student.imageRightsSigned !== 'Sim' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                      <ShieldAlert className="text-white" size={16} />
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Sem Direito de Imagem</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6 sm:space-y-8">
            {/* Cabeçalho com Nome e N° */}
            <div className="border-b-4 border-gray-50 pb-5 sm:pb-8 flex flex-col items-center text-center">
              <div className="w-full">
                <span className="text-[#3b5998] text-xs font-black uppercase block mb-3 tracking-widest">NOME COMPLETO</span>
                <h3 className="text-gray-900 font-black text-3xl sm:text-4xl leading-tight uppercase tracking-tight mb-2">{student.name}</h3>
                <div className="flex items-center justify-center gap-1 text-gray-400 font-black uppercase mb-4">
                  <span className="text-sm tracking-widest">N° {student.roomNumber || '-'}</span>
                </div>
              </div>
              {!isAdmin && (
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-gray-400 mt-2">
                  <ShieldAlert size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Apenas Admin</span>
                </div>
              )}
            </div>

            {/* Informações Básicas (Sempre Visíveis) - AGORA ACIMA DO SHOW MORE INFO */}
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-1.5 sm:gap-4">
              <div className="py-3 px-1 sm:p-4 bg-white rounded-2xl border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[#3b5998] text-[9px] sm:text-[9px] font-black uppercase block mb-1 tracking-widest leading-none">ANO/TURMA</span>
                <p className="font-black text-gray-800 text-xs sm:text-lg leading-none">{student.grade}</p>
              </div>
              <div className="py-3 px-1 sm:p-4 bg-white rounded-2xl border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[#3b5998] text-[9px] sm:text-[9px] font-black uppercase block mb-1 tracking-widest leading-none">PERÍODO</span>
                <p className="font-black text-gray-800 text-xs sm:text-lg uppercase leading-none">{student.shift}</p>
              </div>
              <div className="py-3 px-1 sm:p-4 bg-white rounded-2xl border-2 border-gray-50 shadow-sm flex flex-col items-center justify-center text-center">
                <span className="text-[#3b5998] text-[9px] sm:text-[9px] font-black uppercase block mb-1 tracking-widest leading-none">NASCIMENTO</span>
                <p className="font-black text-gray-800 text-xs sm:text-lg leading-none">
                  {student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>

            {/* Informações Expandidas (RG, CPF, RA/RGA) - AGORA ABAIXO DAS BÁSICAS */}
            {showMoreInfo && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-3">
                  <div className="bg-[#3b5998] py-1.5 px-4 rounded-2xl shadow-lg border-b-4 border-blue-900 flex flex-col items-center">
                    <span className="text-[9px] font-black text-blue-200 uppercase block mb-0.5 tracking-widest">RG DO ALUNO</span>
                    <p className="text-lg sm:text-xl font-black text-white whitespace-nowrap leading-tight">{student.studentRG || '-'}</p>
                  </div>
                  <div className="bg-[#3b5998] py-1.5 px-4 rounded-2xl shadow-lg border-b-4 border-blue-900 flex flex-col items-center">
                    <span className="text-[9px] font-black text-blue-200 uppercase block mb-0.5 tracking-widest">CPF DO ALUNO</span>
                    <p className="text-lg sm:text-xl font-black text-white whitespace-nowrap leading-tight">{student.studentCPF || '-'}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <AcademicRecordBox />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-white rounded-3xl border-2 border-gray-50 p-4 sm:p-8">
                {/* Seção Responsáveis */}
                <div className="flex items-start gap-2 sm:gap-5">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#3b5998] shrink-0">
                    <User size={18} className="sm:hidden" />
                    <User size={24} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3 sm:mb-4 pt-1.5 sm:pt-2">Responsáveis</p>
                    <div className="space-y-6">
                      {student.filiacao1 && (
                        <div className="flex flex-col border-b border-gray-50 pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                            <div>
                              <p className="text-base sm:text-lg font-bold text-gray-800 truncate">{student.filiacao1}</p>
                              {student.obsFiliacao1 && (
                                <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">{student.obsFiliacao1}</p>
                              )}
                            </div>
                            <p className="text-sm sm:text-base font-black text-[#3b5998] whitespace-nowrap">{student.telefone1 || '-'}</p>
                          </div>

                          {showMoreInfo && (
                            <div className="grid grid-cols-[1fr_1.3fr] gap-2 mt-2 pt-2 border-t border-dashed border-gray-100 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="bg-blue-50/50 py-1.5 px-2 sm:px-3 rounded-xl border border-blue-100 flex flex-col items-center">
                                <span className="text-[8px] sm:text-[9px] font-black text-[#3b5998] uppercase block mb-0.5 tracking-tighter">RG RESP.</span>
                                <p className="text-sm sm:text-lg font-black text-gray-800 leading-tight whitespace-nowrap">{student.resp1RG || '-'}</p>
                              </div>
                              <div className="bg-blue-50/50 py-1.5 px-2 sm:px-3 rounded-xl border border-blue-100 flex flex-col items-center">
                                <span className="text-[8px] sm:text-[9px] font-black text-[#3b5998] uppercase block mb-0.5 tracking-tighter">CPF RESP.</span>
                                <p className="text-sm sm:text-lg font-black text-gray-800 leading-tight whitespace-nowrap">{student.resp1CPF || '-'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {student.filiacao2 && (
                        <div className="flex flex-col border-b border-gray-50 pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                            <div>
                              <p className="text-base sm:text-lg font-bold text-gray-800 truncate">{student.filiacao2}</p>
                              {student.obsFiliacao2 && (
                                <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">{student.obsFiliacao2}</p>
                              )}
                            </div>
                            <p className="text-sm sm:text-base font-black text-[#3b5998] whitespace-nowrap">{student.telefone2 || '-'}</p>
                          </div>

                          {showMoreInfo && (
                            <div className="grid grid-cols-[1fr_1.3fr] gap-2 mt-2 pt-2 border-t border-dashed border-gray-100 animate-in fade-in slide-in-from-top-1 duration-300">
                              <div className="bg-gray-100/50 py-1.5 px-2 sm:px-3 rounded-xl border border-gray-200 flex flex-col items-center">
                                <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase block mb-0.5 tracking-tighter">RG RESP.</span>
                                <p className="text-sm sm:text-lg font-black text-gray-800 leading-tight whitespace-nowrap">{student.resp2RG || '-'}</p>
                              </div>
                              <div className="bg-gray-100/50 py-1.5 px-2 sm:px-3 rounded-xl border border-gray-200 flex flex-col items-center">
                                <span className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase block mb-0.5 tracking-tighter">CPF RESP.</span>
                                <p className="text-sm sm:text-lg font-black text-gray-800 leading-tight whitespace-nowrap">{student.resp2CPF || '-'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {hasAdditionalPhones && (
                        <div className="space-y-4 pt-4 border-t border-gray-50">
                          {student.telefone3 && (
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Phone size={12} className="text-[#3b5998]" />
                                  <p className="text-sm sm:text-base font-black text-[#3b5998]">{student.telefone3}</p>
                                </div>
                                {student.obsTelefone3 && (
                                  <span className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest truncate max-w-[50%]">{student.obsTelefone3}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {student.telefone4 && (
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Phone size={12} className="text-[#3b5998]" />
                                  <p className="text-sm sm:text-base font-black text-[#3b5998]">{student.telefone4}</p>
                                </div>
                                {student.obsTelefone4 && (
                                  <span className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest truncate max-w-[50%]">{student.obsTelefone4}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Caixa de Saída */}
              <div className="bg-blue-50/40 p-5 sm:p-6 rounded-3xl border-2 border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#3b5998] shadow-sm">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <span className="text-[#3b5998] text-[9px] font-black uppercase block tracking-widest">MODO DE SAÍDA</span>
                    <p className="font-black text-[#3b5998] text-base sm:text-lg uppercase leading-tight">{student.departureMethod || 'NÃO DEFINIDO'}</p>
                  </div>
                </div>
              </div>

              {/* Botão Mais Informações - Simplificado sem ícone esquerdo e com ícone de Mais no direito */}
              {isAdmin && (
                <button
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 bg-white rounded-3xl border-2 border-gray-50 hover:border-gray-100 transition-all group"
                >
                  <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                    {showMoreInfo ? 'Ocultar informações' : 'Mais informações'}
                  </span>
                  {showMoreInfo ? (
                    <Minus className="text-gray-300 group-hover:text-[#3b5998] transition-colors" size={20} />
                  ) : (
                    <Plus className="text-gray-300 group-hover:text-[#3b5998] transition-colors" size={20} />
                  )}
                </button>
              )}
            </div>

            <div className="pt-8">
              <div className="flex flex-col items-center gap-4 mb-8 text-center">
                <h4 className="text-[#3b5998] font-black uppercase text-sm tracking-widest">Histórico de Ocorrências</h4>
                <button
                  onClick={() => {
                    console.log(`🔘 Occurrence button clicked for student: ${student.id}`);
                    console.log(`📍 Navigating to: /occurrences/new/${student.id}`);
                    navigate(`/occurrences/new/${student.id}`);
                  }}
                  className="w-full sm:w-auto bg-[#3b5998] text-white text-[11px] font-black px-12 py-3 rounded-full uppercase shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                >
                  + Novo Registro
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentOccurrences.length > 0 ? (
                  studentOccurrences.map(occ => (
                    <div
                      key={occ.id}
                      className="bg-white p-5 rounded-2xl border-2 border-gray-50 shadow-sm flex justify-between items-center group cursor-pointer transition-all"
                      onClick={() => navigate(`/occurrences/${occ.id}`, { state: { from: 'student' } })}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${occ.category === 'Comportamental' ? 'bg-red-500' : 'bg-blue-500'}`} />
                          {occ.isConfidential && <EyeOff size={10} className="text-red-500" />}
                          <p className="font-black text-gray-800 text-sm uppercase tracking-tighter truncate">{occ.title}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {new Date(occ.date).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-gray-300 group-hover:text-[#3b5998] transition-colors" />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 text-[10px] font-black uppercase">Nenhum registro encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDetail;
