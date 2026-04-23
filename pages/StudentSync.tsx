import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthUser, Student, Shift, DepartureMethod } from '../types';
import { studentService } from '../services/studentService';
import Papa from 'papaparse';
import { UploadCloud, CheckCircle, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';

interface StudentSyncProps {
  user: AuthUser;
  onToggleRole: () => void;
  notify?: (message: string, type: 'success' | 'error' | 'info') => void;
}


interface UpdateDetail {
  student: Student;
  changes: string[];
}

interface SyncSummary {
  inserts: Student[];
  updates: UpdateDetail[];
  inactivations: Student[];
  unchanged: number;
}

const StudentSync: React.FC<StudentSyncProps> = ({ user, onToggleRole, notify }) => {

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<SyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load current students to compare
    studentService.fetchStudents()
      .then(data => setCurrentStudents(data))
      .catch(err => {
        console.error(err);
        setError("Erro ao carregar banco de dados atual.");
      });
  }, []);

  const normalizeString = (str: any) => {
    if (!str) return '';
    return String(str).trim();
  };

  const mapCsvToStudent = (row: any): Partial<Student> => {
    // Expected CSV headers (upper or title case, handled by normalize)
    return {
      name: normalizeString(row['NOME']) || normalizeString(row['Nome']),
      registrationNumber: normalizeString(row['RA']) || normalizeString(row['ra']),
      grade: `${normalizeString(row['SÉRIE']) || normalizeString(row['Serie'])} ${normalizeString(row['TURMA']) || normalizeString(row['Turma'])}`.trim(),
      shift: (normalizeString(row['PERÍODO']) || normalizeString(row['Periodo']) || Shift.MORNING) as Shift,
      studentStatus: (normalizeString(row['SITUAÇÃO']) || normalizeString(row['Situacao']) || 'Ativo') as any,
      roomNumber: normalizeString(row['SALA']) || normalizeString(row['N SALA']) || '',
      departureMethod: (normalizeString(row['COMO VAI EMBORA']) || 'Responsável') as DepartureMethod,
      // Default empty for other required fields
      rga: '', studentRG: '', studentCPF: '', photoUrl: '', filiacao1: '', obsFiliacao1: '', 
      telefone1: '', resp1RG: '', resp1CPF: '', filiacao2: '', obsFiliacao2: '', telefone2: '', 
      resp2RG: '', resp2CPF: '', telefone3: '', obsTelefone3: '', telefone4: '', obsTelefone4: '', birthDate: ''
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSummary(null);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const processCsv = () => {
    if (!file) return;
    setParsing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const csvRows = results.data as any[];
          
          if (csvRows.length === 0) {
            throw new Error("O arquivo CSV está vazio.");
          }

          // Check required columns
          const firstRow = csvRows[0];
          const hasRA = ('RA' in firstRow) || ('ra' in firstRow);
          const hasNome = ('NOME' in firstRow) || ('Nome' in firstRow);

          if (!hasRA || !hasNome) {
            throw new Error("O arquivo não possui as colunas obrigatórias 'RA' e 'NOME'. Verifique os cabeçalhos.");
          }

          const inserts: Student[] = [];
          const updates: UpdateDetail[] = [];
          const inactivations: Student[] = [];
          let unchangedCount = 0;

          // Map CSV Data
          const csvStudentsMap = new Map<string, Partial<Student>>();
          csvRows.forEach(row => {
            const stu = mapCsvToStudent(row);
            if (stu.registrationNumber) {
              csvStudentsMap.set(stu.registrationNumber, stu);
            }
          });

          // Check DB vs CSV
          currentStudents.forEach(dbStudent => {
            const csvMatch = csvStudentsMap.get(dbStudent.registrationNumber);
            if (csvMatch) {
              // Found in both. Check if changed.
              const changes: string[] = [];
              if (dbStudent.name !== csvMatch.name) changes.push(`Nome: ${dbStudent.name} ➔ ${csvMatch.name}`);
              if (dbStudent.grade !== csvMatch.grade) changes.push(`Turma: ${dbStudent.grade} ➔ ${csvMatch.grade}`);
              if (dbStudent.studentStatus !== csvMatch.studentStatus) changes.push(`Situação: ${dbStudent.studentStatus} ➔ ${csvMatch.studentStatus}`);
              if (dbStudent.shift !== csvMatch.shift) changes.push(`Período: ${dbStudent.shift} ➔ ${csvMatch.shift}`);
              
              if (changes.length > 0) {
                updates.push({ 
                  student: { ...dbStudent, ...csvMatch } as Student,
                  changes
                });
              } else {
                unchangedCount++;
              }
              // Mark as processed
              csvStudentsMap.delete(dbStudent.registrationNumber);
            } else {
              // In DB but NOT in CSV -> Inactivate if active
              if (dbStudent.studentStatus === 'Ativo') {
                inactivations.push({ ...dbStudent, studentStatus: 'Inativo' });
              }
            }
          });

          // Remaining in csvStudentsMap are New (Inserts)
          csvStudentsMap.forEach(csvStu => {
            // Give them a dummy ID for now, DB will auto-generate
            inserts.push(csvStu as Student);
          });

          setSummary({
            inserts,
            updates,
            inactivations,
            unchanged: unchangedCount
          });

        } catch (err: any) {
          setError(err.message || "Erro ao processar o arquivo.");
        } finally {
          setParsing(false);
        }
      },
      error: (parseError) => {
        setError(`Erro na leitura do CSV: ${parseError.message}`);
        setParsing(false);
      }
    });
  };

  const executeSync = async () => {
    if (!summary) return;
    setSyncing(true);
    setError(null);
    setSuccessMsg(null);

    const allUpdates = [
      ...summary.updates.map(u => u.student),
      ...summary.inactivations
    ];

    try {
      const result = await studentService.syncStudents(summary.inserts, allUpdates);
      if (result.success) {
        notify?.("Sincronização concluída com sucesso!", "success");
        setSummary(null);

        setFile(null);
        // Reload current state
        const newData = await studentService.fetchStudents();
        setCurrentStudents(newData);
      } else {
        const firstErr = result.errors[0];
        const errorMsg = firstErr?.error?.message || firstErr?.error?.details || JSON.stringify(firstErr?.error) || 'Erro desconhecido';
        setError(`Falha ao inserir/atualizar: "${firstErr?.student}". Detalhe: ${errorMsg}`);
      }
    } catch (err: any) {
      setError(`Erro de rede ou servidor: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Layout title="Sincronizar Base CSV" user={user} onToggleRole={onToggleRole}>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full pb-24">
        <div className="bg-white p-8 rounded-[32px] border-2 border-gray-50 shadow-sm space-y-6">
          
          <div className="flex items-center gap-4 border-b-2 border-gray-50 pb-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#3b5998]">
              <UploadCloud size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-[#3b5998]">Atualização em Lote</h2>
              <p className="text-sm text-gray-500 font-medium">Faça upload de uma planilha CSV para sincronizar alunos.</p>
            </div>
          </div>

          {!summary && !successMsg && (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-[#3b5998]/30 rounded-3xl p-10 text-center hover:bg-blue-50/50 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <UploadCloud size={48} className="mx-auto text-[#3b5998]/50 group-hover:text-[#3b5998] transition-colors mb-4" />
                <h3 className="font-black text-[#3b5998] uppercase text-lg mb-1">
                  {file ? file.name : "Selecione o arquivo CSV"}
                </h3>
                <p className="text-sm text-gray-400">
                  {file ? "Clique para trocar o arquivo" : "Apenas arquivos no formato CSV UTF-8 suportados."}
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertTriangle size={20} />
                  {error}
                </div>
              )}

              <button
                onClick={processCsv}
                disabled={!file || parsing}
                className="w-full py-4 bg-[#3b5998] text-white rounded-2xl font-black tracking-widest uppercase hover:bg-blue-700 disabled:opacity-50 transition-all flex justify-center items-center gap-2 border-b-4 border-blue-900"
              >
                {parsing ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Analisar Arquivo
              </button>
            </div>
          )}

          {successMsg && (
            <div className="text-center space-y-6 py-10">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase text-green-700">{successMsg}</h3>
              <button
                onClick={() => setSuccessMsg(null)}
                className="px-8 py-3 bg-gray-100 text-gray-700 rounded-full font-bold uppercase text-sm hover:bg-gray-200 transition-colors"
              >
                Sincronizar outro arquivo
              </button>
            </div>
          )}

          {summary && !successMsg && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="font-black text-gray-800 uppercase tracking-tighter text-lg flex items-center gap-2">
                <Info size={20} className="text-[#3b5998]" /> Resumo da Sincronização
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-5 rounded-2xl border border-green-100">
                  <span className="block text-green-800 font-black text-3xl mb-1">{summary.inserts.length}</span>
                  <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Alunos Novos</span>
                </div>
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                  <span className="block text-blue-800 font-black text-3xl mb-1">{summary.updates.length}</span>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Atualizações</span>
                </div>
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                  <span className="block text-red-800 font-black text-3xl mb-1">{summary.inactivations.length}</span>
                  <span className="text-xs font-bold text-red-700 uppercase tracking-widest">A Inativar</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 font-medium bg-gray-50 p-3 rounded-lg text-center">
                Existem <b>{summary.unchanged}</b> alunos no arquivo que não possuem alterações em relação ao banco atual.
              </p>

              {(summary.updates.length > 0 || summary.inserts.length > 0 || summary.inactivations.length > 0) && (
                <div className="border border-[#3b5998]/20 rounded-2xl overflow-hidden mt-4 shadow-inner bg-gray-50/30">
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full bg-[#3b5998]/5 p-4 text-left font-black text-[#3b5998] uppercase text-xs tracking-widest flex items-center justify-between hover:bg-[#3b5998]/10 transition-colors"
                  >
                    Ver detalhes das alterações ({summary.updates.length + summary.inserts.length + summary.inactivations.length})
                    <span className="text-xl leading-none">{showDetails ? '-' : '+'}</span>
                  </button>
                  
                  {showDetails && (
                    <div className="p-4 bg-white max-h-80 overflow-y-auto custom-scrollbar space-y-6">
                      
                      {/* NOVOS ALUNOS */}
                      {summary.inserts.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 flex items-center gap-2 px-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" /> Novos Alunos ({summary.inserts.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {summary.inserts.map((stu, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-green-50/50 border border-green-100/50">
                                <span className="block font-black text-gray-800 text-xs truncate">{stu.name}</span>
                                <span className="text-[9px] font-bold text-green-700 uppercase tracking-tighter">{stu.grade}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ATUALIZAÇÕES */}
                      {summary.updates.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2 px-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Atualizações ({summary.updates.length})
                          </h4>
                          <div className="space-y-2">
                            {summary.updates.map((update, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-blue-50/30 border border-blue-100/50">
                                <span className="block font-black text-gray-800 text-xs mb-1">{update.student.name}</span>
                                <ul className="space-y-1 pl-1">
                                  {update.changes.map((change, cIdx) => (
                                    <li key={cIdx} className="text-[10px] text-gray-600 font-medium flex items-start gap-2">
                                      <span className="text-blue-400 mt-1">•</span>
                                      {change}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* INATIVAÇÕES */}
                      {summary.inactivations.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 flex items-center gap-2 px-1">
                            <span className="w-2 h-2 rounded-full bg-red-500" /> Alunos a Inativar ({summary.inactivations.length})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {summary.inactivations.map((stu, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                                <span className="block font-black text-gray-800 text-xs truncate">{stu.name}</span>
                                <span className="text-[9px] font-bold text-red-700 uppercase tracking-tighter">Status: Ativo ➔ Inativo</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertTriangle size={20} />
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setSummary(null)}
                  disabled={syncing}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black tracking-widest uppercase hover:bg-gray-200 transition-all border-b-4 border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeSync}
                  disabled={syncing}
                  className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black tracking-widest uppercase hover:bg-green-600 transition-all border-b-4 border-green-700 flex justify-center items-center gap-2 shadow-lg shadow-green-200"
                >
                  {syncing ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentSync;
