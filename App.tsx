
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
import SystemLog from './pages/SystemLog';
import { Student, Occurrence, AuthUser, LogEntry } from './types';
import { studentService } from './services/studentService';
import { occurrenceService } from './services/occurrenceService';
import { logService } from './services/logService';
import { supabase } from './services/supabase';
import { detectStudentChanges, formatChangesForLog } from './utils/changeDetection';

const TEST_USERS: AuthUser[] = [
  { id: 'user-1', name: 'Usuário 1', role: 'User', email: 'user1@escola.com' },
  { id: 'user-2', name: 'Usuário 2', role: 'User', email: 'user2@escola.com' },
  { id: 'editor-1', name: 'Editor', role: 'Editor', email: 'editor@escola.com' },
  { id: 'manager-1', name: 'Gestor', role: 'Manager', email: 'gestor@escola.com' },
  { id: 'admin-1', name: 'Administrador', role: 'Admin', email: 'admin@escola.com' },
];

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('carometro_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Mantendo o estado apenas para o usuário atual padrão (Admin para visualização total)
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const user = TEST_USERS[currentUserIndex];

  const handleToggleRole = () => {
    setCurrentUserIndex((prev) => (prev + 1) % TEST_USERS.length);
  };

  // Fetch Data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, occurrencesData, logsData] = await Promise.all([
        studentService.fetchStudents(),
        occurrenceService.fetchOccurrences(),
        logService.fetchLogs()
      ]);
      setStudents(studentsData);
      setOccurrences(occurrencesData);
      setLogs(logsData);
      console.log(`📊 App loaded: ${studentsData.length} students, ${occurrencesData.length} occurrences, ${logsData.length} logs`);
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
          // Expecting payload to have: id_func, nome_func (or we fetch it)
          if (payload.id_func) {
            await authenticateWithIdFunc(payload.id_func);
          } else if (payload.id && payload.name) {
            // Direct trust (if Portal sends full data)
            const cleanUser: AuthUser = {
              id: payload.id,
              name: payload.name,
              role: payload.role || 'User',
              email: payload.email || 'educacao@sme.prefeitura.sp.gov.br',
              idFunc: payload.id // Assuming ID is id_func
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

  const authenticateWithIdFunc = async (idFunc: string) => {
    try {
      // Fetch employee data
      const { data: funcData, error: funcError } = await supabase
        .from('FUNCIONARIOS')
        .select('*')
        .eq('id_func', idFunc)
        .single();

      if (funcData && !funcError) {
        console.log("✅ Authenticated as:", funcData.nome_func);
        // Update the user object with real data
        const cleanUser: AuthUser = {
          id: funcData.id_func,
          name: funcData.nome_func,
          role: 'User', // Default role, can be enhanced logic later
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

  const setAuthenticatedUser = (user: AuthUser) => {
    // Override the default TEST_USER in the array (hacky but works for current structure)
    TEST_USERS[0] = user;
    // Force re-render/update
    setCurrentUserIndex(0);
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
      alert('Erro ao criar aluno. Verifique os dados.');
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
      alert('Erro ao salvar alterações no banco de dados.');
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
      alert('Erro ao salvar ocorrência.');
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
                user.role === 'User' ? (
                  <Navigate to="/" replace />
                ) : (
                  <StudentCreate
                    students={students}
                    onCreate={createStudent}
                    user={user}
                    onToggleRole={handleToggleRole}
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
                user.role === 'User' ? (
                  <Navigate to="/" replace />
                ) : (
                  <StudentEdit
                    students={students}
                    onUpdate={updateStudent}
                    user={user}
                    onToggleRole={handleToggleRole}
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
                />
              }
            />

            <Route
              path="/occurrences/new-multi"
              element={
                <OccurrenceAddMulti
                  students={students}
                  onAddOccurrence={handleCreateOccurrence}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            <Route
              path="/occurrences/:id"
              element={
                <OccurrenceDetail
                  occurrences={occurrences}
                  students={students}
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
                      }
                    } catch (err) {
                      console.error('Erro ao excluir ocorrência:', err);
                      alert('Erro ao excluir ocorrência.');
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
                    } catch (err) {
                      console.error('Erro ao atualizar ocorrência:', err);
                      alert('Erro ao salvar alterações na ocorrência.');
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
                      }
                    } catch (err) {
                      console.error('Erro ao excluir ocorrência:', err);
                      alert('Erro ao excluir ocorrência.');
                      throw err;
                    }
                  }}
                  user={user}
                  onToggleRole={handleToggleRole}
                />
              }
            />

            {/* Log do Sistema */}
            <Route
              path="/logs"
              element={
                user.role !== 'Admin' ? (
                  <Navigate to="/" replace />
                ) : (
                  <SystemLog
                    logs={logs}
                  />
                )
              }
            />
            <Route path="*" element={<Navigate to="/turnos" />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
