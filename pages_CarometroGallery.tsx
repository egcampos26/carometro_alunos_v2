
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, Shift } from '../types';
import { Search, UserCircle2 } from 'lucide-react';

interface CarometroGalleryProps {
  students: Student[];
}

const CarometroGallery: React.FC<CarometroGalleryProps> = ({ students }) => {
  const { shift, grade } = useParams<{ shift: string; grade: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => {
    const isAllShifts = shift === Shift.ALL || shift === 'Todos';
    const isAllGrades = grade === 'Todos';

    const matchesShift = isAllShifts || s.shift === shift;
    const matchesGrade = isAllGrades || s.grade === grade;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesShift && matchesGrade && matchesSearch;
  });

  const displayTitle = (
    <div className="flex flex-col items-center leading-none">
      <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase mb-0.5">{grade === 'Todos' ? 'ALUNOS' : (grade || 'ALUNOS')}</span>
      <span className="text-[9px] sm:text-[10px] font-bold opacity-70 tracking-widest uppercase">CARÔMETRO</span>
    </div>
  );

  return (
    <Layout title={displayTitle}>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* Search Bar */}
        <div className="relative mb-10 max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Buscar aluno por nome..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b5998] rounded-2xl outline-none shadow-sm text-base font-medium transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-10 sm:gap-y-14">
            {filteredStudents.map((student) => (
              <div 
                key={student.id} 
                className="flex flex-col items-center group cursor-pointer transition-all"
                onClick={() => navigate(`/student/${student.id}`)}
              >
                <div className="w-full aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden shadow-sm mb-3 border-4 border-transparent group-hover:border-[#3b5998] group-hover:shadow-lg transition-all relative">
                  <img 
                    src={student.photoUrl} 
                    alt={student.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-center flex flex-col w-full px-1">
                  <span className="text-[11px] sm:text-xs font-black text-gray-800 uppercase leading-tight line-clamp-2">
                    {student.name}
                  </span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <UserCircle2 size={10} className="text-[#3b5998]" />
                    <span className="text-[10px] sm:text-[11px] text-[#3b5998] font-bold uppercase tracking-tighter">
                      {student.grade}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
