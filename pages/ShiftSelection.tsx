
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Shift, AuthUser } from '../types';
import { ClipboardList, Activity, UserPlus } from 'lucide-react';

interface ShiftSelectionProps {
  user: AuthUser;
  onToggleRole: () => void;
}

const ShiftSelection: React.FC<ShiftSelectionProps> = ({ user, onToggleRole }) => {
  const navigate = useNavigate();

  const handleSelect = (shift: Shift) => {
    console.log(`🔘 Shift clicked: ${shift}, navigating to: /turnos/${shift}`);
    if (shift === Shift.ALL) {
      navigate(`/carometro/Todos/Todos`);
    } else {
      navigate(`/turnos/${shift}`);
    }
  };

  const headerTitle = (
    <div className="flex flex-col items-center justify-center leading-tight px-2">
      <span className="text-lg sm:text-2xl md:text-3xl font-black tracking-tighter uppercase whitespace-nowrap">CARÔMETRO DOS ALUNOS</span>
    </div>
  );

  return (
    <Layout
      title={headerTitle}
      showHome={false}
      showBack={false}
      user={user}
      onToggleRole={onToggleRole}
    >
      <div className="px-6 sm:px-10 md:px-12 flex flex-col h-full max-w-5xl mx-auto w-full">

        {/* Container de instrução com padding controlado para manter proporção */}
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
          <h2 className="text-[#3b5998] font-black uppercase tracking-widest text-lg sm:text-xl md:text-2xl text-center">
            SELECIONE UM PERÍODO
          </h2>
        </div>

        {/* Bloco de Botões */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <button
            onClick={() => handleSelect(Shift.MORNING)}
            className="w-full bg-[#3b5998] text-white py-8 sm:py-12 rounded-3xl font-black text-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest border-b-4 border-blue-900 group"
          >
            <span className="group-hover:scale-110 transition-transform block">MANHÃ</span>
          </button>
          <button
            onClick={() => handleSelect(Shift.INTEGRAL)}
            className="w-full bg-[#3b5998] text-white py-8 sm:py-12 rounded-3xl font-black text-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest border-b-4 border-blue-900 group"
          >
            <span className="group-hover:scale-110 transition-transform block">INTEGRAL</span>
          </button>
          <button
            onClick={() => handleSelect(Shift.AFTERNOON)}
            className="w-full bg-[#3b5998] text-white py-8 sm:py-12 rounded-3xl font-black text-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest border-b-4 border-blue-900 group"
          >
            <span className="group-hover:scale-110 transition-transform block">TARDE</span>
          </button>
          <button
            onClick={() => handleSelect(Shift.ALL)}
            className="w-full bg-blue-50 text-[#3b5998] py-8 sm:py-12 rounded-3xl font-black text-xl shadow-md hover:bg-blue-100 active:scale-95 transition-all uppercase tracking-widest border-b-4 border-blue-200 group"
          >
            <span className="group-hover:scale-110 transition-transform block">TODOS OS ALUNOS</span>
          </button>
        </div>

        {/* Botões de Ação Final */}
        <div className="pb-10 space-y-4 mt-auto sm:mt-0">
          <button
            onClick={() => navigate('/occurrences')}
            className="w-full bg-white text-[#3b5998] py-5 rounded-3xl font-black text-sm sm:text-base shadow-sm border-2 border-[#3b5998] flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all uppercase tracking-widest"
          >
            <ClipboardList size={22} />
            Consultar Ocorrências
          </button>

          {user.role !== 'User' && (
            <button
              onClick={() => navigate('/student/new')}
              className="w-full bg-[#3b5998] text-white py-5 rounded-3xl font-black text-sm sm:text-base shadow-sm border-2 border-[#3b5998] flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest"
            >
              <UserPlus size={22} />
              Incluir Novo Aluno
            </button>
          )}

          {user.role === 'Admin' && (
            <button
              onClick={() => navigate('/logs')}
              className="w-full bg-gray-50 text-gray-500 py-5 rounded-3xl font-black text-sm sm:text-base shadow-sm border-2 border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-95 transition-all uppercase tracking-widest"
            >
              <Activity size={22} />
              Log do Sistema
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ShiftSelection;
