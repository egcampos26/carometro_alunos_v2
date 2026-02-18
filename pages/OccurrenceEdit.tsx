
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Occurrence, AuthUser } from '../types';
import { UserCheck, Calendar, Save, Eye, EyeOff, Search, CheckCircle2, X, Users } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

interface OccurrenceEditProps {
  students: Student[];
  occurrences: Occurrence[];
  onUpdateOccurrence: (occ: Occurrence) => Promise<void>;
  onAddOccurrence: (occ: Occurrence) => Promise<void>;
  onDeleteOccurrence: (id: string) => Promise<void>;
  user: AuthUser;
}

const OccurrenceEdit: React.FC<OccurrenceEditProps> = ({ students, occurrences, onUpdateOccurrence, onAddOccurrence, onDeleteOccurrence, user }) => {
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
  const [isSaving, setIsSaving] = useState(false);

  // New state for adding students
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (occurrence) {
      setTitle(occurrence.title);
      setDescription(occurrence.description);
      setDate(occurrence.date);
      setCategory(occurrence.category);
      setIsConfidential(occurrence.isConfidential || false);

      // Verificação de permissão
      const canEdit = user.role === 'Admin' || user.role === 'Manager' || ((user.role === 'User' || user.role === 'Editor') && occurrence.registeredBy === user.name);
      if (!canEdit) {
        navigate(`/occurrences/${id}`, { replace: true });
      }

      // Initialize selectedIds with existing group members (excluding self)
      if (occurrence.groupId) {
        const groupMembers = occurrences.filter(o => o.groupId === occurrence.groupId && o.id !== occurrence.id);
        // Only map if we find valid students
        const memberIds = groupMembers.map(m => m.studentId).filter(id => students.some(s => s.id === id));
        setSelectedIds(memberIds);
      } else {
        setSelectedIds([]);
      }
    }
  }, [occurrence, occurrences, user, navigate, id, students]);

  if (!occurrence || !student) {
    return (
      <Layout title="ERRO">
        <div className="p-8 text-center">
          <p className="text-gray-500">Registro não encontrado.</p>
        </div>
      </Layout>
    );
  }

  // Filter students for search
  const filteredStudents = studentSearch.trim() === ''
    ? []
    : students.filter(s =>
      (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase())) &&
      s.id !== student.id && // Exclude current student
      !selectedIds.includes(s.id) // Exclude already selected
    ).slice(0, 5);

  const toggleAdditionalStudent = (studentId: string) => {
    setSelectedIds(prev =>
      prev.includes(studentId) ? prev.filter(i => i !== studentId) : [...prev, studentId]
    );
    setStudentSearch('');
  };

  const getStudent = (id: string) => students.find(s => s.id === id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date) return;

    setIsSaving(true);

    try {
      // 1. Identify Group Members Changes
      const originalGroupMembers = occurrence.groupId
        ? occurrences.filter(o => o.groupId === occurrence.groupId && o.id !== occurrence.id)
        : [];

      const originalMemberIds = originalGroupMembers.map(m => m.studentId);

      // Removed students (were in group, now not in selectedIds)
      const studentsToRemove = originalGroupMembers.filter(m => !selectedIds.includes(m.studentId));

      // Added students (in selectedIds, but weren't in group)
      const studentsToAddIds = selectedIds.filter(id => !originalMemberIds.includes(id));

      // 2. Determine effective groupId
      let groupId = occurrence.groupId;

      // If we have selected students (new or kept) and no group ID, create one
      if (!groupId && selectedIds.length > 0) {
        groupId = `group-${Date.now()}`;
      } else if (selectedIds.length === 0 && originalGroupMembers.length > 0) {
        // If no one else is selected, and there were original group members, remove from group
        groupId = undefined;
      } else if (!groupId && selectedIds.length === 0) {
        // If no group ID and no selected students, keep groupId as undefined
        groupId = undefined;
      }


      // 3. Update existing occurrence
      const updatedOcc: Occurrence = {
        ...occurrence,
        date,
        title,
        description,
        category,
        isConfidential,
        groupId: groupId // Assign the group ID (new, existing, or removed)
      };

      await onUpdateOccurrence(updatedOcc);

      // 4. Handle Removals (Delete occurrences)
      if (studentsToRemove.length > 0) {
        await Promise.all(studentsToRemove.map(m => onDeleteOccurrence(m.id)));
      }

      // 5. Handle Additions (Create occurrences)
      if (studentsToAddIds.length > 0) {
        const promises = studentsToAddIds.map((newStudentId, index) => {
          const newOcc: Occurrence = {
            id: (Date.now() + index).toString(), // Temporary ID
            studentId: newStudentId,
            groupId: groupId, // Must be defined if we are adding
            date: date,
            title,
            description,
            category,
            registeredBy: user.name,
            isConfidential
          };
          return onAddOccurrence(newOcc);
        });

        await Promise.all(promises);
      }

      // 6. Update REMAINING group members (sync changes)
      // We should ideally update the other members too if the title/desc changed
      // But user didn't explicitly ask for full sync. 
      // Yet "Group" implies sync. The previous "Add Multi" syncs on creation.
      // If we don't sync, they drift apart.
      // Let's safe-guard: Update ONLY if they are still in the group (not removed).
      const membersToUpdate = originalGroupMembers.filter(m => selectedIds.includes(m.studentId));

      if (membersToUpdate.length > 0) {
        const updates = membersToUpdate.map(m => ({
          ...m,
          date,
          title,
          description,
          category,
          isConfidential,
          groupId
        }));
        await Promise.all(updates.map(u => onUpdateOccurrence(u)));
      }


      // Navigation logic based on previous location
      const from = location.state?.from;

      if (from === 'student') {
        navigate(`/student/${updatedOcc.studentId}`, { replace: true });
      } else if (from === 'list') {
        navigate('/occurrences', { replace: true });
      } else {
        // Default fallback: go back if possible, otherwise student page
        if (window.history.length > 2) {
          navigate(-1);
        } else {
          navigate(`/student/${updatedOcc.studentId}`, { replace: true });
        }
      }

    } catch (error) {
      console.error("Failed to update occurrence:", error);
      // Alert is handled in App.tsx, but we stop saving state here
    } finally {
      setIsSaving(false);
    }
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

          {/* Chips dos selecionados */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedIds.map(id => {
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
              disabled={isSaving}
              className="flex-[2] bg-[#3b5998] text-white py-4 sm:py-5 rounded-3xl font-black uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-sm sm:text-base tracking-widest border-b-4 border-blue-900 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Salvar {selectedIds.length > 0 ? `(+${selectedIds.length} alunos)` : 'Alterações'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default OccurrenceEdit;
