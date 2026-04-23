
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthUser, Student } from '../types';
import { CreditCard } from 'lucide-react';
import { SHIFT_GRADES } from '../constants';
import { Shift } from '../types';

interface CarteirinhaClassSelectionProps {
  students: Student[];
  user: AuthUser;
  onToggleRole: () => void;
}

const CarteirinhaClassSelection: React.FC<CarteirinhaClassSelectionProps> = ({ students, user, onToggleRole }) => {
  const navigate = useNavigate();

  // Pega todas as turmas de todos os turnos, filtra apenas com alunos ativos
  const allGrades = Object.values(SHIFT_GRADES).flat();
  const uniqueGrades = Array.from(new Set(allGrades));

  // Filtra apenas turmas com alunos ativos
  const availableGrades = uniqueGrades.filter(grade =>
    students.some(s => s.grade === grade && (s.studentStatus || '').toLowerCase() === 'ativo')
  );

  const headerTitle = (
    <div className="flex flex-col items-center leading-none px-1">
      <span className="text-[14px] sm:text-3xl font-black tracking-tight uppercase mb-0.5 whitespace-nowrap">CRIAR CARTEIRINHAS</span>
      <span className="text-[9px] sm:text-sm font-bold opacity-70 tracking-widest uppercase truncate max-w-full">Selecione uma turma</span>
    </div>
  );

  return (
    <Layout
      title={headerTitle}
      user={user}
      onToggleRole={onToggleRole}
      onBack={() => navigate('/turnos')}
    >
      <div className="p-4 sm:p-8 md:p-12 2xl:px-20 max-w-[1920px] mx-auto w-full">
        {/* Botão Todas as Turmas */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/carteirinhas/Todos')}
            className="w-full bg-[#3b5998] text-white py-5 rounded-2xl font-black text-base sm:text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-3 border-b-4 border-blue-900"
          >
            <CreditCard size={22} />
            Todas as Turmas
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs text-center">Ou selecione uma turma específica</p>
        </div>

        {availableGrades.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4 sm:gap-6">
            {availableGrades.map((grade) => (
              <button
                key={grade}
                onClick={() => navigate(`/carteirinhas/${grade}`)}
                className="bg-[#3b5998] text-white aspect-square flex items-center justify-center rounded-2xl font-black text-xl sm:text-2xl shadow-md hover:bg-blue-700 hover:scale-105 active:scale-90 transition-all border-b-4 border-blue-900 px-2 text-center"
              >
                {grade}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhuma turma encontrada</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CarteirinhaClassSelection;
