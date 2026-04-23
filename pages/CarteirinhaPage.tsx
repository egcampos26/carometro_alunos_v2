
import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Student, AuthUser } from '../types';
import { Printer, Loader2 } from 'lucide-react';
import { NO_IMAGE_RIGHTS_URL, DEFAULT_STUDENT_PHOTO_URL } from '../constants';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CarteirinhaPageProps {
  students: Student[];
  user: AuthUser;
  onToggleRole: () => void;
}

const ANO_LETIVO = '2026';

// A imagem Carteirinha.png (após recorte do fundo) tem proporção de 720x1054 (ratio ~0.683)
// Usamos uma largura fixa de 240px → altura = 240 / 0.683 ≈ 351px
const CARD_WIDTH = 240;
const CARD_HEIGHT = Math.round(CARD_WIDTH / 0.683); // ~351px

const CarteirinhaCard: React.FC<{ student: Student }> = ({ student }) => {
  const hasImageRights = student.imageRightsSigned !== 'Não';
  const photoUrl = hasImageRights
    ? (student.photoUrl || DEFAULT_STUDENT_PHOTO_URL)
    : NO_IMAGE_RIGHTS_URL;

  // Tamanho da foto circular — ~59% da largura do card
  const photoSize = Math.round(CARD_WIDTH * 0.59); // ~142px
  // Posição da foto: centrada horizontalmente
  const photoTop = Math.round(CARD_HEIGHT * 0.225);   // Descendo para alinhar perfeitamente com o círculo branco do mosaico
  const photoLeft = Math.round((CARD_WIDTH - photoSize) / 2); // centralizado

  // Posições dos textos (em px a partir do topo)
  const nameTop = Math.round(CARD_HEIGHT * 0.810);   // Descendo para não sobrepor DRE BT
  const gradeTop = Math.round(CARD_HEIGHT * 0.885);  // Descendo para manter o espaçamento
  const anoTop = Math.round(CARD_HEIGHT * 0.965);    // Descendo para ficar próximo da borda inferior

  return (
    <div style={{ margin: '8px', flexShrink: 0, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <div
        className="carteirinha-card-inner"
        style={{
          position: 'relative',
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
          minWidth: `${CARD_WIDTH}px`,
          minHeight: `${CARD_HEIGHT}px`,
          backgroundImage: 'url(/Carteirinha.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
          fontFamily: "'Arial Black', 'Segoe UI', Arial, sans-serif",
          backgroundColor: '#ffffff'
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
            left: '36px',
            right: '36px',
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
              fontWeight: 900,
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
              fontSize: '13px',
              fontWeight: 900,
              color: '#FFFFFF',
              display: 'block',
              letterSpacing: '0.05em',
              textShadow: '0px 1px 4px rgba(0,0,0,0.5)'
            }}
          >
            {ANO_LETIVO}
          </span>
        </div>
      </div>
    </div>
  );
};

const CarteirinhaPage: React.FC<CarteirinhaPageProps> = ({ students, user, onToggleRole }) => {
  const { grade } = useParams<{ grade: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const isAll = grade === 'Todos';

  const filteredStudents = students
    .filter(s => {
      const matchesGrade = isAll || s.grade === grade;
      const isAtivo = (s.studentStatus || '').toLowerCase() === 'ativo';
      return matchesGrade && isAtivo;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const displayGrade = isAll ? 'TODAS AS TURMAS' : grade;

  // Gera PDF com 3 colunas × 3 linhas de carteirinhas por página A4
  const generatePDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);

    try {
      // Pega os cards internos (sem margem) para capturar o tamanho exato
      const cards = printRef.current.querySelectorAll<HTMLElement>('.carteirinha-card-inner');
      if (cards.length === 0) return;

      // A4 em mm
      const PAGE_W_MM = 210;
      const PAGE_H_MM = 297;
      const CARD_W_MM = 55;
      const CARD_H_MM = Math.round(CARD_W_MM / 0.683); // Preserva a proporção original do card ~80.5mm
      const COLS = 3;
      const ROWS = 3; // Agora que o card é mais baixo, cabem 3 linhas por página A4
      const CARDS_PER_PAGE = COLS * ROWS;
      const GAP_X_MM = 6;
      const GAP_Y_MM = 5;
      const PAD_X_MM = (PAGE_W_MM - COLS * CARD_W_MM - (COLS - 1) * GAP_X_MM) / 2; // centraliza
      const PAD_Y_MM = (PAGE_H_MM - ROWS * CARD_H_MM - (ROWS - 1) * GAP_Y_MM) / 2;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      let pageIndex = 0;

      for (let i = 0; i < cards.length; i++) {
        const posInPage = i % CARDS_PER_PAGE;
        if (posInPage === 0 && i > 0) {
          pdf.addPage();
          pageIndex++;
        }

        const col = posInPage % COLS;
        const row = Math.floor(posInPage / COLS);
        const x = PAD_X_MM + col * (CARD_W_MM + GAP_X_MM);
        const y = PAD_Y_MM + row * (CARD_H_MM + GAP_Y_MM);

        // Renderiza o card como imagem
        const canvas = await html2canvas(cards[i], {
          scale: 3,           // 3x para máxima nitidez (resolve o achatamento ao não forçar dimensões estritas)
          useCORS: true,      // permite imagens de outros domínios
          allowTaint: true,
          backgroundColor: '#ffffff', // Fundo branco evita os cantos pretos nas quinas arredondadas
          logging: false,
        });

        // Use properties on canvas to determine width and height
        const canvasRatio = canvas.height / canvas.width;
        // Keep CARD_W_MM to 55mm, but calculate correct print height
        const printHeight = CARD_W_MM * canvasRatio;

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', x, y, CARD_W_MM, printHeight);
      }

      const turmaLabel = isAll ? 'Todas_as_Turmas' : (grade || 'Turma').replace(/[°\s]/g, '');
      pdf.save(`Carteirinhas_${turmaLabel}_${ANO_LETIVO}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const headerTitle = (
    <div className="flex flex-col items-center leading-none px-1">
      <span className="text-[14px] sm:text-3xl font-black tracking-tight uppercase mb-0.5 whitespace-nowrap">CARTEIRINHAS</span>
      <span className="text-[9px] sm:text-sm font-bold opacity-70 tracking-widest uppercase truncate max-w-full">{displayGrade}</span>
    </div>
  );

  return (
    <>
      {/* Estilos de impressão — A4, 3 colunas x 3 linhas, 5,5cm x 8,5cm por carteirinha */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #carteirinha-print-area, #carteirinha-print-area * { visibility: visible !important; }

          #carteirinha-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 8mm 9.5mm !important;
            background: white !important;
            display: grid !important;
            grid-template-columns: repeat(3, 55mm) !important;
            gap: 5mm 6mm !important;
            align-content: start !important;
            justify-content: start !important;
            box-sizing: border-box !important;
          }

          .carteirinha-card {
            width: 55mm !important;
            height: 80.5mm !important;
            margin: 0 !important;
            flex-shrink: 0 !important;
            box-shadow: none !important;
            border-radius: 3.5mm !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            transform: scale(0.867) !important;
            transform-origin: top left !important;
            position: relative !important;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
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
              onClick={generatePDF}
              disabled={generating}
              className={`flex items-center gap-3 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-md transition-all border-b-4 ${
                generating 
                  ? 'bg-blue-400 border-blue-500 cursor-not-allowed' 
                  : 'bg-[#3b5998] hover:bg-blue-700 active:scale-95 border-blue-900'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Printer size={20} />
                  Imprimir Carteirinhas
                </>
              )}
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
