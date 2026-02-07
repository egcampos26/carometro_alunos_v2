
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChevronLeft } from 'lucide-react';
import { AuthUser } from '../types';

interface LayoutProps {
  title: React.ReactNode;
  children: React.ReactNode;
  showHome?: boolean;
  showBack?: boolean;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  showHome = true,
  showBack = true,
  leftAction,
  rightAction
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (location.pathname === '/') return;
    navigate(-1);
  };

  const handleHome = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/', { replace: false });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <header className="bg-[#3b5998] h-16 sm:h-20 flex items-center justify-between px-2 shrink-0 text-white shadow-md z-30 relative border-b border-white/10">

        {/* Lado Esquerdo: Home */}
        <div className="flex items-center gap-2 w-24 sm:w-56 pl-1">
          {showHome && (
            <button
              onClick={handleHome}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all focus:outline-none shrink-0"
              title="Ir para o Início"
            >
              <Home size={22} />
            </button>
          )}
          {leftAction}
        </div>

        {/* Centro: Título */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-1 overflow-hidden min-w-0">
          {typeof title === 'string' ? (
            <h1 className="text-sm sm:text-xl font-black uppercase tracking-tight truncate w-full">
              {title}
            </h1>
          ) : (
            title
          )}
        </div>

        {/* Lado Direito: Ações Contextuais + Voltar */}
        <div className="flex items-center justify-end w-24 sm:w-56 pr-1 gap-3">
          {rightAction}
          {showBack && (
            <button
              onClick={handleBack}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all border border-white/10 focus:outline-none shrink-0"
              aria-label="Voltar"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50/30 safe-area-bottom custom-scrollbar">
        {children}
      </main>
    </div>
  );
};

export default Layout;
