
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
  onBack?: () => void;
  user?: AuthUser;
  onToggleRole?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  title,
  children,
  showHome = true,
  showBack = true,
  leftAction,
  rightAction,
  onBack,
  user,
  onToggleRole
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onBack) {
      onBack();
      return;
    }

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
      {/* Header: 100% width, sem max-width */}
      <header className="bg-[#3b5998] w-full h-16 sm:h-20 flex items-center justify-between px-2 shrink-0 text-white shadow-md z-30 relative border-b border-white/10">

        {/* Conteúdo interno do header centralizado com max-w-7xl */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between h-full">

          {/* Lado Esquerdo: Home */}
          <div className="flex items-center gap-2 min-w-[3.5rem] pl-1 z-20">
            {showHome && (
              <button
                onClick={handleHome}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all focus:outline-none shrink-0"
                title="Ir para o Início"
              >
                <Home size={22} />
              </button>
            )}

            {/* Role Switcher (Visible only if user prop is present) */}
            {user && onToggleRole && (
              <button
                onClick={onToggleRole}
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg border transition-all ml-1 sm:ml-2 shadow-sm active:scale-95 shrink-0 ${user.role === 'Admin'
                  ? 'bg-red-500/20 border-red-400/30 text-red-100 hover:bg-red-500/30'
                  : user.role === 'Manager'
                    ? 'bg-amber-500/20 border-amber-400/30 text-amber-100 hover:bg-amber-500/30'
                    : user.role === 'Editor'
                      ? 'bg-purple-500/20 border-purple-400/30 text-purple-100 hover:bg-purple-500/30'
                      : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-100 hover:bg-emerald-500/30'
                  }`}
                title={`Trocar usuário (Atual: ${user.name})`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80 leading-none">AMB. TESTE</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-tight leading-none whitespace-nowrap">{user.name}</span>
                </div>
              </button>
            )}

            {leftAction}
          </div>

          {/* Centro: Título (absoluto dentro do inner container) */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-1 overflow-hidden min-w-0 absolute inset-x-0 mx-auto pointer-events-none">
            <div className="pointer-events-auto max-w-[50%] sm:max-w-[60%] mx-auto">
              {typeof title === 'string' ? (
                <h1 className="text-sm sm:text-xl font-black uppercase tracking-tight truncate w-full">
                  {title}
                </h1>
              ) : (
                title
              )}
            </div>
          </div>

          {/* Lado Direito: Ações Contextuais + Voltar */}
          <div className="flex items-center justify-end min-w-[3.5rem] pr-1 gap-3 z-20 ml-auto">
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

        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-50/30 safe-area-bottom custom-scrollbar">
        {children}
      </main>
    </div>
  );
};

export default Layout;
