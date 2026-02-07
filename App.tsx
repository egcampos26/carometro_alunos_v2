
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShiftSelection from './pages/ShiftSelection';
import ClassSelection from './pages/ClassSelection';
import CarometroGallery from './pages/CarometroGallery';
import StudentDetail from './pages/StudentDetail';
import StudentEdit from './pages/StudentEdit';
import OccurrencesList from './pages/OccurrencesList';
import OccurrenceAdd from './pages/OccurrenceAdd';
import OccurrenceAddMulti from './pages/OccurrenceAddMulti';
import OccurrenceDetail from './pages/OccurrenceDetail';
import OccurrenceEdit from './pages/OccurrenceEdit';
import SystemLog from './pages/SystemLog';
import { Student, Occurrence, AuthUser, LogEntry } from './types';
import { MOCK_STUDENTS } from './constants';

const TEST_USERS: AuthUser[] = [
  { id: 'admin-1', name: 'Diretora Silvia', role: 'Admin', email: 'silvia@escola.com' },
  { id: 'teacher-1', name: 'Prof. Eduardo', role: 'Teacher', email: 'eduardo@escola.com' },
  { id: 'teacher-2', name: 'Profa. Márcia', role: 'Teacher', email: 'marcia@escola.com' },
];

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('carometro_students');
    return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });

  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => {
    const saved = localStorage.getItem('carometro_occurrences');
    return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('carometro_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Mantendo o estado apenas para o usuário atual padrão (Admin para visualização total)
  const [currentUserIndex] = useState(0);
  const user = TEST_USERS[currentUserIndex];

  useEffect(() => {
    localStorage.setItem('carometro_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('carometro_occurrences', JSON.stringify(occurrences));
  }, [occurrences]);

  useEffect(() => {
    localStorage.setItem('carometro_logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (action: string, details: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: user.name,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const updateStudent = (updatedStudent: Student) => {
    const oldStudent = students.find(s => s.id === updatedStudent.id);
    
    // Gerar resumo de alterações
    let changeSummary = '';
    if (oldStudent) {
      const changes = [];
      if (oldStudent.name !== updatedStudent.name) changes.push(`Nome: de "${oldStudent.name}" para "${updatedStudent.name}"`);
      if (oldStudent.grade !== updatedStudent.grade) changes.push(`Turma: de "${oldStudent.grade}" para "${updatedStudent.grade}"`);
      if (oldStudent.shift !== updatedStudent.shift) changes.push(`Período: de "${oldStudent.shift}" para "${updatedStudent.shift}"`);
      if (oldStudent.photoUrl !== updatedStudent.photoUrl) changes.push('Foto de perfil foi atualizada');
      if (oldStudent.studentStatus !== updatedStudent.studentStatus) changes.push(`Status: de "${oldStudent.studentStatus}" para "${updatedStudent.studentStatus}"`);
      if (oldStudent.departureMethod !== updatedStudent.departureMethod) changes.push(`Modo de saída: de "${oldStudent.departureMethod}" para "${updatedStudent.departureMethod}"`);
      if (oldStudent.telefone3 !== updatedStudent.telefone3) changes.push(`Tel 3: "${oldStudent.telefone3}" -> "${updatedStudent.telefone3}"`);
      if (oldStudent.obsTelefone3 !== updatedStudent.obsTelefone3) changes.push(`Obs Tel 3: "${oldStudent.obsTelefone3}" -> "${updatedStudent.obsTelefone3}"`);
      if (oldStudent.telefone4 !== updatedStudent.telefone4) changes.push(`Tel 4: "${oldStudent.telefone4}" -> "${updatedStudent.telefone4}"`);
      if (oldStudent.obsTelefone4 !== updatedStudent.obsTelefone4) changes.push(`Obs Tel 4: "${oldStudent.obsTelefone4}" -> "${updatedStudent.obsTelefone4}"`);
      
      changeSummary = changes.length > 0 
        ? `\n\nAlterações realizadas:\n• ${changes.join('\n• ')}` 
        : '\n\nNenhuma alteração de conteúdo detectada.';
    }

    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    addLog('Edição de Aluno', `O perfil de ${updatedStudent.name} (RA: ${updatedStudent.registrationNumber}) foi atualizado por ${user.name}.${changeSummary}`);
  };

  const addOccurrence = (occurrence: Occurrence) => {
    const student = students.find(s => s.id === occurrence.studentId);
    setOccurrences(prev => [...prev, occurrence]);
    addLog('Registro de Ocorrência', `Nova ocorrência registrada para ${student?.name || 'Aluno'}.\n\nTítulo: ${occurrence.title}\nCategoria: ${occurrence.category}\nDescrição: ${occurrence.description}`);
  };

  const updateOccurrence = (updatedOcc: Occurrence) => {
    const oldOcc = occurrences.find(o => o.id === updatedOcc.id);
    
    let changeSummary = '';
    if (oldOcc) {
      const changes = [];
      if (oldOcc.title !== updatedOcc.title) changes.push(`Título: "${oldOcc.title}" -> "${updatedOcc.title}"`);
      if (oldOcc.category !== updatedOcc.category) changes.push(`Categoria: "${oldOcc.category}" -> "${updatedOcc.category}"`);
      if (oldOcc.description !== updatedOcc.description) changes.push('O texto da descrição foi alterado');
      if (oldOcc.date !== updatedOcc.date) changes.push(`Data: ${oldOcc.date} -> ${updatedOcc.date}`);
      
      changeSummary = changes.length > 0 
        ? `\n\nAlterações na ocorrência:\n• ${changes.join('\n• ')}` 
        : '\n\nNenhuma alteração de conteúdo detectada.';
    }

    setOccurrences(prev => prev.map(o => o.id === updatedOcc.id ? updatedOcc : o));
    addLog('Edição de Ocorrência', `A ocorrência "${updatedOcc.title}" foi editada.${changeSummary}`);
  };

  const deleteOccurrence = (id: string) => {
    const occToDelete = occurrences.find(o => o.id === id);
    const student = occToDelete ? students.find(s => s.id === occToDelete.studentId) : null;
    
    setOccurrences(prev => prev.filter(occ => occ.id !== id));
    
    if (occToDelete) {
      addLog('Exclusão de Ocorrência', `A ocorrência "${occToDelete.title}" (ID: ${id}) do aluno ${student?.name || 'Desconhecido'} foi excluída permanentemente do sistema por ${user.name}.`);
    }
  };

  return (
    <HashRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col w-full overflow-x-hidden">
        <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto bg-white shadow-sm md:my-4 md:rounded-xl overflow-hidden relative">
          <Routes>
            <Route path="/" element={<ShiftSelection user={user} />} />
            <Route path="/classes/:shift" element={<ClassSelection user={user} onToggleRole={() => {}} />} />
            <Route path="/carometro/:shift/:grade" element={<CarometroGallery students={students} user={user} onToggleRole={() => {}} />} />
            <Route path="/student/:id" element={<StudentDetail students={students} occurrences={occurrences} user={user} onToggleRole={() => {}} />} />
            <Route path="/edit-student/:id" element={<StudentEdit students={students} onUpdate={updateStudent} user={user} onToggleRole={() => {}} />} />
            <Route path="/occurrences" element={<OccurrencesList students={students} occurrences={occurrences} user={user} onToggleRole={() => {}} />} />
            <Route path="/occurrence/:id" element={<OccurrenceDetail students={students} occurrences={occurrences} user={user} onDelete={deleteOccurrence} />} />
            <Route path="/edit-occurrence/:id" element={<OccurrenceEdit students={students} occurrences={occurrences} onUpdate={updateOccurrence} user={user} />} />
            <Route path="/add-occurrence/:studentId" element={<OccurrenceAdd students={students} onAdd={addOccurrence} user={user} />} />
            <Route path="/add-multi-occurrence" element={<OccurrenceAddMulti students={students} onAdd={addOccurrence} user={user} />} />
            <Route path="/logs" element={<SystemLog logs={logs} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
