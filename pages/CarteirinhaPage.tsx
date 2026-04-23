
import React, { useRef } from 'react';
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

// A imagem Carteirinha.png tem proporção aproximada de 507x1070 (ratio ~0.474)
// Usamos uma largura fixa de 240px → altura = 240 / 0.474 ≈ 506px
const CARD_WIDTH = 240;
const CARD_HEIGHT = Math.round(CARD_WIDTH / 0.474); // ~506px

const CarteirinhaCard: React.FC<{ student: Student }> = ({ student }) => {
  const hasImageRights = student.imageRightsSigned !== 'Não';
  const photoUrl = hasImageRights
    ? (student.photoUrl || DEFAULT_STUDENT_PHOTO_URL)
    : NO_IMAGE_RIGHTS_URL;

  // Tamanho da foto circular — ~52% da largura do card (maior)
  const photoSize = Math.round(CARD_WIDTH * 0.52); // ~125px
  // Posição da foto: centrada horizontalmente, topo em ~35% da altura (mais baixo)
  const photoTop = Math.round(CARD_HEIGHT * 0.35);   // ~177px
  const photoLeft = Math.round((CARD_WIDTH - photoSize) / 2); // centralizado

  // Posições dos textos (em px a partir do topo)
  const nameTop = Math.round(CARD_HEIGHT * 0.755);   // ~382px  — nome (descido)
  const gradeTop = Math.round(CARD_HEIGHT * 0.800);  // ~404px  — "Turma: 4º Ano B" (subido)
  const anoTop = Math.round(CARD_HEIGHT * 0.860);    // ~435px  — Ano letivo (subido)

  return (
    <div
      className="carteirinha-card"
      style={{
        position: 'relative',
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        flexShrink: 0,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        margin: '8px',
        // Imagem de fundo = a carteirinha PNG
        backgroundImage: 'url(/Carteirinha.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
        fontFamily: "'Arial Black', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* ── Foto circular do aluno ── */}
      <div
        style={{
          position: 'absolute',
          top: `${photoTop}px`,
          left: `${photoLeft}px`,
          width: `${photoSize}px`,
          height: `${photoSize}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          // Sem borda própria — o círculo cinza/branco da imagem já faz a borda
        }}
      >
        <img
          src={photoUrl}
          alt={student.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            filter: hasImageRights ? 'none' : 'grayscale(100%) opacity(0.5)',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_STUDENT_PHOTO_URL;
          }}
        />
      </div>

      {/* ── Nome do aluno ── */}
      <div
        style={{
          position: 'absolute',
          top: `${nameTop}px`,
          left: '26px',
          right: '26px',
          textAlign: 'center',
          padding: '0',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 900,
            color: '#1a3a7a',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            display: 'block',
            letterSpacing: '0.01em',
            wordBreak: 'break-word',
          }}
        >
          {student.name}
        </span>
      </div>

      {/* ── Turma ── */}
      <div
        style={{
          position: 'absolute',
          top: `${gradeTop}px`,
          left: '20px',
          right: '20px',
          textAlign: 'center',
          padding: '0',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#1a3a7a',
            display: 'block',
            letterSpacing: '0.02em',
          }}
        >
          {student.grade}
        </span>
      </div>

      {/* ── Ano Letivo ── */}
      <div
        style={{
          position: 'absolute',
          top: `${anoTop}px`,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 10px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#3b6ab5',
            display: 'block',
            letterSpacing: '0.02em',
          }}
        >
          Ano Letivo {ANO_LETIVO}
        </span>
      </div>
    </div>
  );
};

const CarteirinhaPage: React.FC<CarteirinhaPageProps> = ({ students, user, onToggleRole }) => {
  const { grade } = useParams<{ grade: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const isAll = grade === 'Todos';

  const filteredStudents = students
    .filter(s => {
      const matchesGrade = isAll || s.grade === grade;
      const isAtivo = (s.studentStatus || '').toLowerCase() === 'ativo';
      return matchesGrade && isAtivo;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handlePrint = () => {
    window.print();
  };

  const displayGrade = isAll ? 'TODAS AS TURMAS' : grade;

  const headerTitle = (
    <div className="flex flex-col items-center leading-none px-1">
      <span className="text-[14px] sm:text-3xl font-black tracking-tight uppercase mb-0.5 whitespace-nowrap">CARTEIRINHAS</span>
      <span className="text-[9px] sm:text-sm font-bold opacity-70 tracking-widest uppercase truncate max-w-full">{displayGrade}</span>
    </div>
  );

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #carteirinha-print-area, #carteirinha-print-area * { visibility: visible !important; }
          #carteirinha-print-area {
            position: fixed !important;
            inset: 0 !important;
            background: white !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            padding: 10mm !important;
            align-content: flex-start !important;
            justify-content: flex-start !important;
          }
          .carteirinha-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      <Layout
        title={headerTitle}
        user={user}
        onToggleRole={onToggleRole}
        onBack={() => navigate('/carteirinhas')}
      >
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
              onClick={handlePrint}
              className="flex items-center gap-3 bg-[#3b5998] text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all border-b-4 border-blue-900"
            >
              <Printer size={20} />
              Imprimir Carteirinhas
            </button>
          </div>

          {/* Grade de carteirinhas */}
          {filteredStudents.length > 0 ? (
            <div
              id="carteirinha-print-area"
              ref={printRef}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}
            >
              {filteredStudents.map((student) => (
                <CarteirinhaCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                Nenhum aluno ativo encontrado para esta turma
              </p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default CarteirinhaPage;
