
import React, { useState } from 'react';
import { FlaskConical, X, ChevronDown, RotateCcw } from 'lucide-react';
import { AuthUser } from '../types';

type RoleEntry = { label: string; role: AuthUser['role']; name?: string; id?: string };

interface TestModePanelProps {
    realUser: AuthUser;
    simulatedUser: AuthUser | null;
    roles: RoleEntry[];
    onSimulate: (entry: RoleEntry) => void;
    onReset: () => void;
}

const ROLE_COLORS: Record<string, string> = {
    User: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Editor: 'bg-purple-50 text-purple-700 border-purple-200',
    Manager: 'bg-amber-50 text-amber-700 border-amber-200',
    Coordinator: 'bg-teal-50 text-teal-700 border-teal-200',
    Director: 'bg-violet-50 text-violet-700 border-violet-200',
    Admin: 'bg-rose-50 text-rose-700 border-rose-200',
};

const TestModePanel: React.FC<TestModePanelProps> = ({
    realUser,
    simulatedUser,
    roles,
    onSimulate,
    onReset,
}) => {
    const [open, setOpen] = useState(false);
    const isSimulating = simulatedUser !== null;
    const activeRole = simulatedUser?.role ?? realUser.role;
    const activeName = simulatedUser?.name ?? realUser.name;
    const activeId = simulatedUser?.id ?? null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

            {/* Painel expandido */}
            {open && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-64 overflow-hidden">
                    {/* Header do painel */}
                    <div className="bg-[#3b5998] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <FlaskConical size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Modo Teste</span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Info usuário real */}
                    <div className="px-4 pt-3 pb-2">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                            Logado como
                        </p>
                        <p className="text-sm font-black text-gray-700 truncate">{realUser.name}</p>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                            🔑 Admin Real
                        </span>
                    </div>

                    <div className="h-px bg-gray-100 mx-4 my-2" />

                    {/* Simulação atual */}
                    {isSimulating && (
                        <div className="px-4 pb-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                                Simulando
                            </p>
                            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${ROLE_COLORS[activeRole]}`}>
                                <span className="text-xs font-black">{activeName}</span>
                                <button
                                    onClick={() => { onReset(); }}
                                    className="p-1 rounded-lg hover:bg-black/10 transition-colors"
                                    title="Parar simulação"
                                >
                                    <RotateCcw size={12} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Seleção de role */}
                    <div className="px-4 pb-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                            {isSimulating ? 'Trocar para' : 'Simular como'}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {roles.map((entry) => {
                                const entryId = entry.id ?? `sim-${entry.role.toLowerCase()}`;
                                // Considera ativo: Admin (sem simulação) ou o ID exato
                                const isActive = entry.role === 'Admin'
                                    ? !isSimulating
                                    : activeId === entryId;

                                return (
                                    <button
                                        key={entryId}
                                        onClick={() => { onSimulate(entry); }}
                                        className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all active:scale-95 ${isActive
                                                ? ROLE_COLORS[entry.role] + ' shadow-sm'
                                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        {entry.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Botão flutuante */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${isSimulating
                        ? `${ROLE_COLORS[activeRole]} border shadow-lg`
                        : 'bg-[#3b5998] text-white border-[#3b5998]/50 hover:bg-[#2d4373]'
                    }`}
                title="Painel de Modo Teste (só Admin)"
            >
                <FlaskConical size={14} />
                {isSimulating
                    ? <span>Simulando: {activeName}</span>
                    : <span>Modo Teste</span>
                }
                <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
        </div>
    );
};

export default TestModePanel;
