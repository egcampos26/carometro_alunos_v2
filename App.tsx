
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShiftSelection from './pages/ShiftSelection';
import ClassSelection from './pages/ClassSelection';
import CarometroGallery from './pages/CarometroGallery';
import StudentDetail from './pages/StudentDetail';
import StudentEdit from './pages/StudentEdit';
import StudentCreate from './pages/StudentCreate';
import OccurrencesList from './pages/OccurrencesList';
import OccurrenceAdd from './pages/OccurrenceAdd';
import OccurrenceAddMulti from './pages/OccurrenceAddMulti';
import OccurrenceDetail from './pages/OccurrenceDetail';
import OccurrenceEdit from './pages/OccurrenceEdit';
import OccurrenceResolutionPage from './pages/OccurrenceResolution';
import SystemLog from './pages/SystemLog';
import StudentSync from './pages/StudentSync';
import CarteirinhaClassSelection from './pages/CarteirinhaClassSelection';
import CarteirinhaPage from './pages/CarteirinhaPage';
import { Student, Occurrence, OccurrenceResolution, AuthUser, LogEntry } from './types';
import { studentService } from './services/studentService';
import { occurrenceService } from './services/occurrenceService';
import { resolutionService } from './services/resolutionService';
import { logService } from './services/logService';
import { supabase } from './services/supabase';
import { detectStudentChanges, formatChangesForLog } from './utils/changeDetection';
import TestModePanel from './components/TestModePanel';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Mapeia tipo_usuario do Portal para role interno do App
const mapPortalRole = (tipoUsuario: string | undefined): AuthUser['role'] => {
  switch ((tipoUsuario || '').toLowerCase()) {
    case 'administrador': return 'Admin';
    case 'gestor': return 'Manager';
    case 'editor': return 'Editor';
    case 'coordenador': return 'Coordinator';
    case 'diretor': return 'Director';
    case 'usuario':       // fallthrough
    default: return 'User';
  }
};

// Roles simuláveis pelo Admin no modo teste
const SIMULATABLE_ROLES: { label: string; role: AuthUser['role']; name?: string; id?: string }[] = [
  { label: '👤 Usuário', role: 'User' },
  { label: '👤 Usuario1', role: 'User', name: 'Usuario1', id: 'sim-user1' },
  { label: '👤 Usuario2', role: 'User', name: 'Usuario2', id: 'sim-user2' },
  { label: '✏️ Editor', role: 'Editor' },
  { label: '📋 Gestor', role: 'Manager' },
  { label: '🎓 Coordenador', role: 'Coordinator' },
  { label: '🏫 Diretor', role: 'Director' },
  { label: '🔑 Admin', role: 'Admin' },
];

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [resolutions, setResolutions] = useState<OccurrenceResolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = (message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };


  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('carometro_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Usuário real autenticado (vem do Portal via postMessage)
  const [realUser, setRealUser] = useState<AuthUser>(
    { id: 'admin-1', name: 'Administrador', role: 'Admin', email: 'admin@escola.com' }
  );

  // Usuário simulado (só Admin pode simular; null = sem simulação)
  const [simulatedUser, setSimulatedUser] = useState<AuthUser | null>(null);

  // Usuário ativo = simulado (se houver) ou real
  const user = simulatedUser ?? realUser;

  const handleSimulateRole = (entry: { label: string; role: AuthUser['role']; name?: string; id?: string }) => {
    if (realUser.role !== 'Admin') return;
    if (entry.role === 'Admin') {
      setSimulatedUser(null);
      return;
    }
    const displayName = entry.name ?? `[Teste] ${entry.label.replace(/^.+?\s/, '')}`;
    setSimulatedUser({
      id: entry.id ?? `sim-${entry.role.toLowerCase()}`,
      name: displayName,
      role: entry.role,
      email: `${(entry.id ?? `sim-${entry.role.toLowerCase()}`)}@escola.com`,
      idFunc: realUser.idFunc,
    });
  };

  const handleResetSimulation = () => setSimulatedUser(null);

  // Mantido por compatibilidade (não usado mais ativamente)
  const handleToggleRole = () => { };

  // Fetch Data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, occurrencesData, logsData, resolutionsData] = await Promise.all([
        studentService.fetchStudents(),
        occurrenceService.fetchOccurrences(),
        logService.fetchLogs(),
        resolutionService.fetchAllResolutions()
      ]);
      setStudents(studentsData);
      setOccurrences(occurrencesData);
      setLogs(logsData);
      setResolutions(resolutionsData);
      console.log(`📊 App loaded: ${studentsData.length} students, ${occurrencesData.length} occurrences, ${resolutionsData.length} resolutions, ${logsData.length} logs`);
    } catch (err) {
      console.error('Falha ao carregar dados:', err);
      setError('Não foi possível conectar ao banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  // Auth & Data Loading
  useEffect(() => {
    const initApp = async () => {
      let authUser: AuthUser | null = null;
      let isAuthPending = true;

      // 1. Setup postMessage Listener (Priority)
      const messageHandler = async (event: MessageEvent) => {
        // Security: In production, check event.origin
        // if (event.origin !== "https://portal-tarsila.com") return;

        const data = event.data;

        if (data && data.type === 'AUTH_USER' && data.payload) {
          console.log("📩 Received remote auth:", data.payload);
          isAuthPending = false; // Stop the ready signal interval
          const payload = data.payload;

          // Map payload to AuthUser
          // Expecting payload to have: id_func + tipo_usuario from Portal
          if (payload.id_func) {
            // Pass tipo_usuario from portal so role is set correctly
            await authenticateWithIdFunc(payload.id_func, payload.tipo_usuario || payload.role);
          } else if (payload.id && payload.name) {
            // Direct trust (if Portal sends full data)
            const cleanUser: AuthUser = {
              id: payload.id,
              name: payload.name,
              role: mapPortalRole(payload.tipo_usuario || payload.role),
              email: payload.email || 'educacao@sme.prefeitura.sp.gov.br',
              idFunc: payload.id
            };
            setAuthenticatedUser(cleanUser);
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Tell Portal we are ready
      // Send signal repeatedly until we get auth data or timeout (max 10s)
      let attempts = 0;
      const readyInterval = setInterval(() => {
        // Stop if auth received (isAuthPending toggled in messageHandler) or max attempts reached
        if (!isAuthPending || attempts > 20) {
          clearInterval(readyInterval);
          return;
        }
        console.log("📡 Sending CAROMETRO_READY signal to parent...");
        window.parent.postMessage({ type: 'CAROMETRO_READY' }, '*');
        attempts++;
      }, 500);


      // 2. Check for id_func in URL (Fallback/Direct Link)
      const params = new URLSearchParams(window.location.search);
      const idFunc = params.get('id_func');

      if (idFunc) {
        await authenticateWithIdFunc(idFunc);
      }

      // 3. Load Application Data
      await loadData();

      return () => {
        window.removeEventListener('message', messageHandler);
      }
    };

    initApp();
  }, []);

  const authenticateWithIdFunc = async (idFunc: string, tipoUsuarioFromPortal?: string) => {
    try {
      // Fetch employee data
      const { data: funcData, error: funcError } = await supabase
        .from('FUNCIONARIOS')
        .select('*')
        .eq('id_func', idFunc)
        .single();

      if (funcData && !funcError) {
        console.log("✅ Authenticated as:", funcData.nome_func);
        // Prefer tipo_usuario from Portal payload; fallback to FUNCIONARIOS column
        const tipoUsuario = tipoUsuarioFromPortal || funcData.tipo_usuario;
        const role = mapPortalRole(tipoUsuario);
        console.log(`🔑 Role resolved: tipo_usuario='${tipoUsuario}' → role='${role}'`);
        const cleanUser: AuthUser = {
          id: funcData.id_func,
          name: funcData.nome_func,
          role,
          email: funcData.email_edu || funcData.email_sme || 'educacao@sme.prefeitura.sp.gov.br',
          idFunc: funcData.id_func
        };
        setAuthenticatedUser(cleanUser);
      } else {
        console.warn("User not found for id_func:", idFunc);
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  }

  const setAuthenticatedUser = (authUser: AuthUser) => {
    setRealUser(authUser);
    setSimulatedUser(null); // Resetar simulação ao re-autenticar
  }

  const addLog = async (action: string, details: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: user.name,
      action,
      details
    };

    // Update local state immediately for UI responsiveness
    setLogs(prev => [newLog, ...prev]);

    // Save to Supabase in background
    try {
      await logService.createLog(newLog);
    } catch (err) {
      console.error('Failed to save log to database:', err);
    }
  };

  const createStudent = async (student: Student) => {
    try {
      await studentService.createStudent(student);
      await loadData(); // Reload list

      // Update local state if needed (though loadStudents does it)
      // Log action?
    } catch (error) {
      console.error('Error creating student:', error);
      notify('Erro ao criar aluno. Verifique os dados.', 'error');
    }

  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      // 1. Encontrar o aluno original para comparação
      const originalStudent = students.find(s => s.id === updatedStudent.id);

      // 2. Atualizar no Supabase
      await studentService.updateStudent(updatedStudent);

      // 3. Atualizar estado local
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));

      // 4. Log detalhado com mudanças
      if (originalStudent) {
        const changes = detectStudentChanges(originalStudent, updatedStudent);
        const changeDetails = formatChangesForLog(changes);
        addLog(
          'Atualização de Aluno',
          `Aluno: ${updatedStudent.name} (ID: ${updatedStudent.id})\n${changeDetails}`
        );
      } else {
        addLog('Atualização de Aluno', `Aluno ${updatedStudent.name} (ID: ${updatedStudent.id}) atualizado.`);
      }
    } catch (err) {
      console.error('Erro ao atualizar aluno:', err);
      notify('Erro ao salvar alterações no banco de dados.', 'error');
    }

  };

  const handleCreateOccurrence = async (newOccurrence: Occurrence) => {
    try {
      const createdOccurrence = await occurrenceService.createOccurrence(newOccurrence);
      setOccurrences(prev => [createdOccurrence, ...prev]);
      const student = students.find(s => s.id === newOccurrence.studentId);
      const studentName = student ? student.name : 'Aluno Desconhecido';
      addLog('Nova Ocorrência', `Ocorrência "${newOccurrence.title}" criada para o aluno ${studentName}.`);
    } catch (err) {
      console.error('Erro ao criar ocorrência:', err);
      notify('Erro ao salvar ocorrência.', 'error');
    }

  };

  const handleCreateOccurrencesBatch = async (newOccurrences: Occurrence[]) => {
    try {
      await occurrenceService.createOccurrencesBatch(newOccurrences);
      setOccurrences(prev => [...newOccurrences, ...prev]);
      
      const count = newOccurrences.length;
      addLog('Novas Ocorrências (Lote)', `${count} ocorrências criadas simultaneamente via registro múltiplo.`);
      notify(`${count} ocorrências registradas com sucesso!`, 'success');
    } catch (err) {
      console.error('Erro ao criar lote de ocorrências:', err);
      notify('Erro ao salvar lote de ocorrências.', 'error');
    }
  };


  // ─── Handlers de Resoluções ───────────────────────────────────────────────

  const handleCreateResolution = async (resolution: Omit<OccurrenceResolution, 'id' | 'createdAt'>) => {
    try {
      const created = await resolutionService.createResolution(resolution);
      setResolutions(prev => [created, ...prev]);
      const occ = occurrences.find(o => o.id === resolution.idOcorrencia);
      const student = occ ? students.find(s => s.id === occ.studentId) : null;
      addLog('Nova Resolução de Ocorrência', `Intervenção [${resolution.statusOcorrencia}] registrada para ${student?.name ?? 'aluno'} por ${resolution.nomeResponsavel}.`);
    } catch (err) {
      console.error('Erro ao criar resolução:', err);
      notify('Erro ao salvar a intervenção.', 'error');
      throw err;
    }

  };

  const handleUpdateResolution = async (resolution: OccurrenceResolution) => {
    try {
      await resolutionService.updateResolution(resolution);
      setResolutions(prev => prev.map(r => r.id === resolution.id ? resolution : r));
      addLog('Edição de Resolução', `Registro de intervenção atualizado por ${resolution.nomeResponsavel}.`);
    } catch (err) {
      console.error('Erro ao atualizar resolução:', err);
      throw err;
    }
  };

  const handleDeleteResolution = async (id: string) => {
    try {
      await resolutionService.deleteResolution(id);
      setResolutions(prev => prev.filter(r => r.id !== id));
      addLog('Exclusão de Resolução', `Registro de intervenção excluído.`);
    } catch (err) {
      console.error('Erro ao excluir resolução:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b5998] mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="text-center text-red-600 p-8">
          <h2 className="text-2xl font-bold mb-2">Erro de Conexão</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col w-full overflow-x-hidden">
        <div className="flex-1 flex flex-col w-full overflow-hidden relative">

          {/* Toast Notifications */}
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border-2 animate-in slide-in-from-right-10 duration-300 pointer-events-auto min-w-[300px] max-w-md ${
                  n.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
                  n.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                  'bg-[#3b5998] border-blue-400 text-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  n.type === 'success' ? 'bg-green-500/10' :
                  n.type === 'error' ? 'bg-red-500/10' :
                  'bg-white/10'
                }`}>
                  {n.type === 'success' && <CheckCircle size={18} />}
                  {n.type === 'error' && <AlertCircle size={18} />}
                  {n.type === 'info' && <Bell size={18} />}
                </div>
                <p className="text-xs font-bold uppercase tracking-tight flex-1">{n.message}</p>
                <button
                  onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                  className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <X size={14} className="opacity-50" />
                </button>
              </div>
            ))}
          </div>


          {/* Painel flutuante Modo Teste — visível apenas para Admin real */}
          {realUser.role === 'Admin' && (
            <TestModePanel
              realUser={realUser}
              simulatedUser={simulatedUser}
              roles={SIMULATABLE_ROLES}
              onSimulate={handleSimulateRole}
              onReset={handleResetSimulation}
            />
          )}

          <Routes>
            <Route path="/" element={<Navigate to="/turnos" replace />} />

            {/* Fluxo Principal */}
            <Route
              path="/turnos"
              element={
                <ShiftSelection
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            <Route
              path="/turnos/:shift"
              element={
                <ClassSelection
                  students={students}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            <Route
              path="/carometro/:shift/:grade"
              element={
                <CarometroGallery
                  students={students}
                  occurrences={occurrences}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            {/* Detalhes e Edição */}
            <Route
              path="/student/new"
              element={
                (user.role === 'User') ? (
                  <Navigate to="/" replace />
                ) : (
                  <StudentCreate
                    students={students}
                    onCreate={createStudent}
                    user={user}
                    onToggleRole={handleToggleRole}
                    notify={notify}
                  />
                )
              }
            />
            <Route
              path="/student/:id"
              element={
                <StudentDetail
                  students={students}
                  occurrences={occurrences}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            <Route
              path="/student/:id/edit"
              element={
                (user.role === 'User') ? (
                  <Navigate to="/" replace />
                ) : (
                  <StudentEdit
                    students={students}
                    onUpdate={updateStudent}
                    user={user}
                    onToggleRole={handleToggleRole}
                    notify={notify}
                  />
                )
              }
            />

            {/* Ocorrências */}
            <Route
              path="/occurrences"
              element={
                <OccurrencesList
                  students={students}
                  occurrences={occurrences}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            <Route
              path="/occurrences/new/:studentId"
              element={
                <OccurrenceAdd
                  students={students}
                  onAddOccurrence={handleCreateOccurrence}
                  user={user}
                  onToggleRole={handleToggleRole}
                  notify={notify}
                />
              }
            />

            <Route
              path="/occurrences/new-multi"
              element={
                <OccurrenceAddMulti
                  students={students}
                  onAddOccurrences={handleCreateOccurrencesBatch}
                  user={user}
                  onToggleRole={handleToggleRole}
                  notify={notify}
                />
              }
            />


            <Route
              path="/occurrences/:id"
              element={
                <OccurrenceDetail
                  occurrences={occurrences}
                  students={students}
                  resolutions={resolutions}
                  user={user}
                  onDelete={async (idToDelete) => {
                    try {
                      const occToDelete = occurrences.find(o => o.id === idToDelete);
                      await occurrenceService.deleteOccurrence(idToDelete);
                      setOccurrences(prev => prev.filter(occ => occ.id !== idToDelete));
                      const student = occToDelete ? students.find(s => s.id === occToDelete.studentId) : null;
                      const studentName = student ? student.name : 'Aluno Desconhecido';

                      if (occToDelete) {
                        addLog('Exclusão de Ocorrência', `A ocorrência "${occToDelete.title}" do aluno ${studentName} foi excluída.`);
                        notify('Ocorrência excluída com sucesso.', 'info');
                      }
                    } catch (err) {
                      console.error('Erro ao excluir ocorrência:', err);
                      notify('Erro ao excluir ocorrência.', 'error');
                    }
                  }}
                />
              }
            />

            <Route
              path="/occurrences/:id/edit"
              element={
                <OccurrenceEdit
                  occurrences={occurrences}
                  students={students}
                  onUpdateOccurrence={async (updated) => {
                    try {
                      await occurrenceService.updateOccurrence(updated);
                      setOccurrences(prev => prev.map(o => o.id === updated.id ? updated : o));
                      const student = students.find(s => s.id === updated.studentId);
                      const studentName = student ? student.name : 'Aluno Desconhecido';

                      addLog('Edição de Ocorrência', `A ocorrência "${updated.title}" do aluno ${studentName} foi editada.`);
                      notify('Ocorrência atualizada com sucesso.', 'success');
                    } catch (err) {
                      console.error('Erro ao atualizar ocorrência:', err);
                      notify('Erro ao salvar alterações na ocorrência.', 'error');
                      throw err;
                    }
                  }}
                  onAddOccurrence={handleCreateOccurrence}
                  onDeleteOccurrence={async (idToDelete) => {
                    try {
                      const occToDelete = occurrences.find(o => o.id === idToDelete);
                      await occurrenceService.deleteOccurrence(idToDelete);
                      setOccurrences(prev => prev.filter(occ => occ.id !== idToDelete));
                      const student = occToDelete ? students.find(s => s.id === occToDelete.studentId) : null;
                      const studentName = student ? student.name : 'Aluno Desconhecido';

                      if (occToDelete) {
                        addLog('Exclusão de Ocorrência (Edição)', `A ocorrência "${occToDelete.title}" do aluno ${studentName} foi removida.`);
                        notify('Ocorrência excluída.', 'info');
                      }
                    } catch (err) {
                      console.error('Erro ao excluir ocorrência:', err);
                      notify('Erro ao excluir ocorrência.', 'error');
                      throw err;
                    }
                  }}
                  user={user}
                  onToggleRole={handleToggleRole}
                  notify={notify}
                />
              }
            />

            {/* Log do Sistema — somente Admin */}
            <Route
              path="/logs"
              element={
                user.role === 'Admin' ? (
                  <SystemLog
                    logs={logs}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Sincronização CSV — Admin/Manager */}
            <Route
              path="/sync"
              element={
                ['Admin', 'Manager'].includes(user.role) ? (
                  <StudentSync user={user} onToggleRole={handleToggleRole} notify={notify} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Resolução de Ocorrência — somente gestão */}
            <Route
              path="/occurrences/:id/resolution"
              element={
                ['Admin', 'Manager', 'Coordinator', 'Director'].includes(user.role) ? (
                  <OccurrenceResolutionPage
                    occurrences={occurrences}
                    students={students}
                    resolutions={resolutions}
                    user={user}
                    onCreateResolution={handleCreateResolution}
                    onUpdateResolution={handleUpdateResolution}
                    onDeleteResolution={handleDeleteResolution}
                    notify={notify}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/turnos" />} />

            {/* Carteirinhas */}
            <Route
              path="/carteirinhas"
              element={
                <CarteirinhaClassSelection
                  students={students}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />
            <Route
              path="/carteirinhas/:grade"
              element={
                <CarteirinhaPage
                  students={students}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
