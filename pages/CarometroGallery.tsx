
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Shift, AuthUser } from '../types';
import { Search, UserCircle2, CameraOff, Filter } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL } from '../constants';

interface CarometroGalleryProps {
  students: Student[];
  user: AuthUser;
  onToggleRole: () => void;
}

const CarometroGallery: React.FC<CarometroGalleryProps> = ({ students, user, onToggleRole }) => {
  const { shift, grade } = useParams<{ shift: string; grade: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ativo'); // Default em lowercase

  // Define se o usuário atual pode ver e alterar os filtros de situação
  const isAllStudentsPage = (shift === Shift.ALL || shift === 'Todos');
  const canFilterStatus = user.role === 'Admin' && isAllStudentsPage;

  // Extrai todas as situações únicas presentes no banco
  const uniqueStatuses: string[] = Array.from(
    new Set<string>(students.map(s => (s.studentStatus ? String(s.studentStatus).trim().toLowerCase() : 'desconhecido')))
  ).sort();

  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

  const filteredStudents = students.filter(s => {
    const isAllShifts = shift === Shift.ALL || shift === 'Todos';
    const isAllGrades = grade === 'Todos';

    const matchesShift = isAllShifts || s.shift === shift;
    const matchesGrade = isAllGrades || s.grade === grade;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de status case-insensitive:
    const safeStudentStatus = (s.studentStatus || '').toLowerCase();
    const isStatusFiltered = canFilterStatus 
      ? (statusFilter === 'todos' ? true : safeStudentStatus === statusFilter)
      : safeStudentStatus === 'ativo';

    return matchesShift && matchesGrade && matchesSearch && isStatusFiltered;
  });

  const displayTitle = (
    <div className="flex flex-col items-center justify-center leading-tight">
      <span className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">{grade === 'Todos' ? 'ALUNOS' : (grade || 'ALUNOS')}</span>
    </div>
  );

  return (
    <Layout
      title={displayTitle}
      user={user}
      onToggleRole={onToggleRole}
      onBack={() => navigate(`/turnos/${shift}`)}
    >
      <div className="p-4 sm:p-8 2xl:px-12 max-w-[1920px] mx-auto w-full">
        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 max-w-3xl mx-auto">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Buscar aluno por nome..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm text-base font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          {canFilterStatus && (
            <div className="relative w-full sm:w-auto shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 appearance-none bg-white border-2 border-gray-200 focus:border-[#3b5998] text-gray-700 font-bold py-4 pl-12 pr-8 rounded-2xl shadow-sm outline-none transition-all cursor-pointer capitalize"
              >
                <option value="todos" className="capitalize">Todas as Situações</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status} className="capitalize">
                    {capitalize(status)}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b5998]" size={18} />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          )}
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-14">
            {filteredStudents.map((student) => {
              const hasImageRights = student.imageRightsSigned !== 'Não';
              const displayPhoto = hasImageRights ? student.photoUrl : NO_IMAGE_RIGHTS_URL;

              return (
                <div
                  key={student.id}
                  className="flex flex-col items-center group cursor-pointer transition-all"
                  onClick={() => navigate(`/student/${student.id}`)}
                >
                  <div className="w-full aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden shadow-sm mb-3 border-4 border-transparent group-hover:border-[#3b5998] group-hover:shadow-lg transition-all relative">
                    <img
                      src={displayPhoto}
                      alt={student.name}
                      className={`w-full h-full object-cover transition-all ${!hasImageRights ? 'grayscale opacity-60' : ''}`}
                    />
                    {!hasImageRights && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <CameraOff className="text-white drop-shadow-md" size={24} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-center flex flex-col w-full px-1">
                    <span className="text-[11px] sm:text-xs font-black text-gray-800 uppercase leading-tight line-clamp-2">
                      {student.name}
                    </span>
                    <div className="flex items-center justify-center mt-1">
                      <span className="text-sm sm:text-base text-[#3b5998] font-black uppercase tracking-tighter">
                        {student.grade}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <UserCircle2 className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CarometroGallery;
