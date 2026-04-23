
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, AuthUser } from '../types';
import { Printer } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL, DEFAULT_STUDENT_PHOTO_URL } from '../constants';

interface CarteirinhaPageProps {
  students: Student[];
  user: AuthUser;
  onToggleRole: () => void;
}

const ANO_LETIVO = '2026';

// Cartão na tela: proporção 55:85 (igual ao tamanho de impressão)
const CARD_W = 207;
const CARD_H = 320;

const CarteirinhaCard: React.FC<{ student: Student }> = ({ student }) => {
  const hasImageRights = student.imageRightsSigned !== 'Não';
  const photoUrl = hasImageRights
    ? (student.photoUrl || DEFAULT_STUDENT_PHOTO_URL)
    : NO_IMAGE_RIGHTS_URL;

  return (
    <div
      className="carteirinha-card"
      style={{
        position: 'relative',
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        flexShrink: 0,
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        margin: '8px',
        fontFamily: "'Arial Black', Arial, sans-serif",
      }}
    >
      {/* Background: imagem real (imprime corretamente) */}
      <img
        src="/Carteirinha.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          display: 'block',
          zIndex: 0,
        }}
      />

      {/* Foto circular do aluno — posição em % */}
      <div
        style={{
          position: 'absolute',
          zIndex: 1,
          top: '27%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '52%',
          aspectRatio: '1',
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        <img
          src={photoUrl}
          alt={student.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            display: 'block',
            filter: hasImageRights ? 'none' : 'grayscale(100%) opacity(0.5)',
          }}
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_STUDENT_PHOTO_URL; }}
        />
      </div>

      {/* Nome do aluno */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: '74%',
          left: '17%',
          right: '17%',
          textAlign: 'center',
        }}
      >
        <span style={{
          fontSize: '11px',
          fontWeight: 900,
          color: '#1a3a7a',
          textTransform: 'uppercase',
          lineHeight: 1.15,
          display: 'block',
          wordBreak: 'break-word',
        }}>
          {student.name}
        </span>
      </div>

      {/* Turma (ANO/TURMA) */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: '84%',
          left: '10%',
          right: '10%',
          textAlign: 'center',
        }}
      >
        <span style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#1a3a7a',
          display: 'block',
        }}>
          {student.grade}
        </span>
      </div>

      {/* Ano Letivo */}
      <div
        style={{
          position: 'absolute',
          zIndex: 2,
          top: '91%',
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <span style={{
          fontSize: '9px',
          fontWeight: 600,
          color: '#3b6ab5',
          display: 'block',
        }}>
          Ano Letivo {ANO_LETIVO}
        </span>
      </div>
    </div>
  );
};

const CarteirinhaPage: React.FC<CarteirinhaPageProps> = ({ students, user, onToggleRole }) => {
  const { grade } = useParams<{ grade: string }>();
  const navigate = useNavigate();
  const isAll = grade === 'Todos';

  const filteredStudents = students
    .filter(s => (isAll || s.grade === grade) && (s.studentStatus || '').toLowerCase() === 'ativo')
    .sort((a, b) => a.name.localeCompare(b.name));

  const displayGrade = isAll ? 'TODAS AS TURMAS' : grade;

  const headerTitle = (
    <div className="flex flex-col items-center leading-none px-1">
      <span className="text-[14px] sm:text-3xl font-black tracking-tight uppercase mb-0.5 whitespace-nowrap">CARTEIRINHAS</span>
      <span className="text-[9px] sm:text-sm font-bold opacity-70 tracking-widest uppercase truncate max-w-full">{displayGrade}</span>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          /* Esconde tudo exceto a área de impressão */
          body > * { display: none !important; }
          #carteirinha-print-root { display: block !important; }

          #carteirinha-print-root {
            position: fixed;
            inset: 0;
            background: white;
            padding: 8mm 9mm;
            box-sizing: border-box;
          }

          /* Grid: 3 colunas × 3 linhas, cada célula 55mm × 85mm */
          #carteirinha-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 55mm) !important;
            gap: 5mm 6mm !important;
            align-content: start !important;
          }

          /* Cada card imprime em 55mm × 85mm */
          .carteirinha-card {
            width: 55mm !important;
            height: 85mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 3mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            position: relative !important;
          }

          /* Garante que imagens de fundo (img tag) imprimem */
          .carteirinha-card img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page { size: A4 portrait; margin: 0; }
        }

        /* Esconde o root de impressão na tela */
        @media screen {
          #carteirinha-print-root { display: none; }
        }
      `}</style>

      {/* Área exclusiva para impressão (invisível na tela) */}
      <div id="carteirinha-print-root">
        <div id="carteirinha-grid">
          {filteredStudents.map((student) => (
            <CarteirinhaCard key={student.id} student={student} />
          ))}
        </div>
      </div>

      <Layout title={headerTitle} user={user} onToggleRole={onToggleRole} onBack={() => navigate('/carteirinhas')}>
        <div className="p-4 sm:p-6 max-w-[1920px] mx-auto w-full">

          {/* Cabeçalho + botão imprimir */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-[#3b5998] font-black text-lg uppercase tracking-widest">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'} encontrado{filteredStudents.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-gray-400 text-sm font-medium">Carteirinhas — Ano Letivo {ANO_LETIVO}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-3 bg-[#3b5998] text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-900"
            >
              <Printer size={20} />
              Imprimir Carteirinhas
            </button>
          </div>

          {/* Preview na tela */}
          {filteredStudents.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              {filteredStudents.map((student) => (
                <CarteirinhaCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum aluno ativo encontrado</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default CarteirinhaPage;
