
import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, AuthUser } from '../types';
import { Printer, ArrowLeft } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL, DEFAULT_STUDENT_PHOTO_URL } from '../constants';

interface CarteirinhaPageProps {
  students: Student[];
  user: AuthUser;
  onToggleRole: () => void;
}

// Escola fixa
const SCHOOL_NAME = 'TARSILA DO AMARAL - DRE BT';
const ANO_LETIVO = '2026';

const CarteirinhaCard: React.FC<{ student: Student }> = ({ student }) => {
  const hasImageRights = student.imageRightsSigned !== 'Não';
  const photoUrl = hasImageRights
    ? (student.photoUrl || DEFAULT_STUDENT_PHOTO_URL)
    : NO_IMAGE_RIGHTS_URL;

  return (
    <div
      className="carteirinha-card"
      style={{
        width: '230px',
        minHeight: '340px',
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        margin: '8px',
        flexShrink: 0,
      }}
    >
      {/* Top mosaic area */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #1a4fa0 0%, #1e6fb5 25%, #2196a0 40%, #4caf7a 60%, #f5c842 80%, #1a4fa0 100%)',
          padding: '16px 12px 0px 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '210px',
        }}
      >
        {/* Mosaic tile overlay (CSS grid pattern) */}
        <MosaicOverlay />

        {/* Bird decoration (top right) */}
        <div style={{
          position: 'absolute', top: '8px', right: '10px', zIndex: 2,
          fontSize: '22px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
        }}>
          🦜
        </div>

        {/* School name at top */}
        <div style={{
          zIndex: 2,
          textAlign: 'center',
          width: '100%',
          marginBottom: '10px',
        }}>
          <span style={{
            display: 'block',
            fontSize: '10px',
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            lineHeight: 1.3,
          }}>
            {SCHOOL_NAME}
          </span>
        </div>

        {/* Circular photo */}
        <div style={{
          zIndex: 2,
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '5px solid #fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          background: '#e0e8f0',
          marginBottom: '12px',
          flexShrink: 0,
        }}>
          <img
            src={photoUrl}
            alt={student.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: hasImageRights ? 'none' : 'grayscale(100%) opacity(0.6)',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_STUDENT_PHOTO_URL;
            }}
          />
        </div>
      </div>

      {/* Bottom info area */}
      <div style={{
        background: '#f5f0e0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 10px 14px 10px',
        gap: '4px',
      }}>
        {/* Student Name */}
        <span style={{
          fontSize: '17px',
          fontWeight: 900,
          color: '#1a3a7a',
          textTransform: 'uppercase',
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: '0.01em',
          wordBreak: 'break-word',
        }}>
          {student.name}
        </span>

        {/* Grade/Turma */}
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#1a3a7a',
          textTransform: 'uppercase',
          textAlign: 'center',
          letterSpacing: '0.03em',
          marginTop: '2px',
        }}>
          Turma: {student.grade}
        </span>

        {/* Ano letivo */}
        <span style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#3b6ab5',
          textAlign: 'center',
          letterSpacing: '0.02em',
          marginTop: '1px',
        }}>
          Ano Letivo {ANO_LETIVO}
        </span>
      </div>
    </div>
  );
};

// Mosaic tile overlay using a CSS pattern
const MosaicOverlay: React.FC = () => {
  const TILE_COLORS = [
    '#1565c0', '#1976d2', '#0288d1', '#0097a7', '#00897b',
    '#43a047', '#7cb342', '#f9a825', '#f57f17', '#1e88e5',
    '#26a69a', '#66bb6a', '#fdd835', '#039be5', '#00acc1',
    '#2e7d32', '#1b5e20', '#0d47a1', '#01579b', '#006064',
  ];
  const tiles: React.ReactNode[] = [];
  const rows = 8;
  const cols = 10;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * cols + c + r * 3) % TILE_COLORS.length;
      tiles.push(
        <div
          key={`${r}-${c}`}
          style={{
            background: TILE_COLORS[idx],
            borderRadius: '2px',
            opacity: 0.55,
          }}
        />
      );
    }
  }
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: `repeat(${10}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: '2px',
      padding: '2px',
      zIndex: 1,
      pointerEvents: 'none',
    }}>
      {tiles}
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
      {/* Print-only styles */}
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
            gap: 12px !important;
            padding: 16px !important;
            align-content: flex-start !important;
            justify-content: flex-start !important;
          }
          .carteirinha-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          @page { margin: 10mm; size: A4; }
        }
      `}</style>

      <Layout
        title={headerTitle}
        user={user}
        onToggleRole={onToggleRole}
        onBack={() => navigate('/carteirinhas')}
      >
        <div className="p-4 sm:p-6 max-w-[1920px] mx-auto w-full">

          {/* Header Actions */}
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

          {/* Cards */}
          {filteredStudents.length > 0 ? (
            <div
              id="carteirinha-print-area"
              ref={printRef}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                justifyContent: 'flex-start',
              }}
            >
              {filteredStudents.map((student) => (
                <CarteirinhaCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum aluno ativo encontrado para esta turma</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default CarteirinhaPage;
