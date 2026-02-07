
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { SHIFT_GRADES } from '../constants';
import { AuthUser, Student } from '../types';

interface ClassSelectionProps {
  students: Student[];
  user: AuthUser;
  onToggleRole: () => void;
}

const ClassSelection: React.FC<ClassSelectionProps> = ({ students, user, onToggleRole }) => {
  const { shift } = useParams<{ shift: string }>();
  const navigate = useNavigate();

  // Obtém as turmas específicas do período ou um array vazio se não houver correspondência
  const gradesForShift = shift ? SHIFT_GRADES[shift] || [] : [];

  // Filtra apenas as turmas que realmente têm alunos cadastrados
  const availableGrades = gradesForShift.filter(grade =>
    students.some(s => s.shift === shift && s.grade === grade)
  );

  const headerTitle = (
    <div className="flex flex-col items-center leading-none px-1">
      <span className="text-[14px] sm:text-3xl font-black tracking-tight uppercase mb-0.5 whitespace-nowrap">SELECIONAR TURMA</span>
      <span className="text-[9px] sm:text-sm font-bold opacity-70 tracking-widest uppercase truncate max-w-full">PERÍODO {shift?.toUpperCase()}</span>
    </div>
  );

  return (
    <Layout
      title={headerTitle}
      user={user}
      onToggleRole={onToggleRole}
    >
      <div className="p-4 sm:p-8 md:p-12 2xl:px-20 max-w-[1920px] mx-auto w-full">
        {availableGrades.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 sm:gap-6">
            {availableGrades.map((grade) => (
              <button
                key={grade}
                onClick={() => navigate(`/carometro/${shift}/${grade}`)}
                className="bg-[#3b5998] text-white aspect-square flex items-center justify-center rounded-2xl font-black text-xl sm:text-2xl shadow-md hover:bg-blue-700 hover:scale-105 active:scale-90 transition-all border-b-4 border-blue-900 px-2 text-center"
              >
                {grade}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhuma turma configurada para este período</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ClassSelection;
