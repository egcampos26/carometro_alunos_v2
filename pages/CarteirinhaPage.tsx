
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
  const photoTop = Math.round(CARD_HEIGHT * 0.170);   // Subindo um pouquinho
  const photoLeft = Math.round((CARD_WIDTH - photoSize) / 2); // centralizado

  // Posições dos textos (em px a partir do topo)
  const nameTop = Math.round(CARD_HEIGHT * 0.755);   // Subindo um pouquinho
  const gradeTop = Math.round(CARD_HEIGHT * 0.830);  // Subindo um pouquinho
  const anoTop = Math.round(CARD_HEIGHT * 0.925);    // Subindo um pouquinho

  return (
    <div className="carteirinha-wrapper" style={{ margin: '8px', flexShrink: 0, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <div
        className="carteirinha-card"
        style={{
          position: 'relative',
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`,
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
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
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

  // Gera imagens JPEG de alta resolução no formato A4 com 3x3 carteirinhas
  const generatePDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);

    try {
      // Pega os cards para capturar o tamanho exato
      const cards = printRef.current.querySelectorAll<HTMLElement>('.carteirinha-card');
      if (cards.length === 0) return;

      // Resolução de Impressão (300 DPI) para folha A4
      const A4_W_PX = 2480; 
      const A4_H_PX = 3508;
      
      // Tamanho do card na impressão em pixels (~55mm de largura)
      const CARD_W_PX = 650; 
      const COLS = 3;
      const ROWS = 3; 
      const CARDS_PER_PAGE = COLS * ROWS;
      
      // Espaçamentos entre os cards (~6mm e ~5mm)
      const GAP_X_PX = 71; 
      const GAP_Y_PX = 59; 
      
      const PAD_X_PX = (A4_W_PX - COLS * CARD_W_PX - (COLS - 1) * GAP_X_PX) / 2; // centraliza

      const turmaLabel = isAll ? 'Todas_as_Turmas' : (grade || 'Turma').replace(/[°\s]/g, '');
      let pageIndex = 1;
      
      let a4Canvas = document.createElement('canvas');
      a4Canvas.width = A4_W_PX;
      a4Canvas.height = A4_H_PX;
      let ctx = a4Canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, A4_W_PX, A4_H_PX);
      }

      const downloadPage = () => {
        const link = document.createElement('a');
        link.download = `Carteirinhas_${turmaLabel}_${ANO_LETIVO}_Pagina_${pageIndex}.jpg`;
        link.href = a4Canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      };

      let PAD_Y_PX = 0;
      let drawH = 0;

      for (let i = 0; i < cards.length; i++) {
        const posInPage = i % CARDS_PER_PAGE;
        if (posInPage === 0 && i > 0) {
          downloadPage();
          pageIndex++;
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, A4_W_PX, A4_H_PX); // Limpa para a nova página
          }
        }

        const col = posInPage % COLS;
        const row = Math.floor(posInPage / COLS);
        const x = PAD_X_PX + col * (CARD_W_PX + GAP_X_PX);

        // Renderiza o card individual com alta qualidade
        const cardCanvas = await html2canvas(cards[i], {
          scale: 3,           
          useCORS: true,      
          allowTaint: true,
          backgroundColor: '#ffffff', 
          logging: false,
        });

        // Na primeira renderização, calcula a altura correta baseada na proporção real
        if (drawH === 0) {
          drawH = CARD_W_PX * (cardCanvas.height / cardCanvas.width);
          PAD_Y_PX = (A4_H_PX - ROWS * drawH - (ROWS - 1) * GAP_Y_PX) / 2;
        }

        const y = PAD_Y_PX + row * (drawH + GAP_Y_PX);

        if (ctx) {
          ctx.drawImage(cardCanvas, x, y, CARD_W_PX, drawH);
        }
      }

      // Baixa a última página
      if (cards.length > 0) {
        downloadPage();
      }

    } catch (err) {
      console.error('Erro ao gerar imagens:', err);
      alert('Erro ao gerar os arquivos. Tente novamente.');
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

          .carteirinha-wrapper {
            width: 55mm !important;
            height: 80.5mm !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            position: relative !important;
          }

          .carteirinha-card {
            width: 240px !important;
            height: 351px !important;
            transform: scale(0.866) !important;
            transform-origin: top left !important;
            box-shadow: none !important;
            border-radius: 3.5mm !important;
            margin: 0 !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
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
                  Gerando Imagens (JPEG)...
                </>
              ) : (
                <>
                  <Printer size={20} />
                  Baixar Imagens (A4)
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
