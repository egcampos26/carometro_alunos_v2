import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Move } from 'lucide-react';
import { getCroppedImg } from '../utils/imageUtils';

interface ImageCropperModalProps {
  image: string;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ image, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      onConfirm(croppedBlob);
    } catch (e) {
      console.error(e);
      alert('Erro ao processar imagem recortada');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onCancel} 
          className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
        >
          <X size={24} />
        </button>
        <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-lg">
          Ajustar Enquadramento
        </div>
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* Cropper Container */}
      <div className="relative w-full flex-1">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          showGrid={true}
          minZoom={0.1}
          style={{
            containerStyle: { background: '#09090b', cursor: 'move' },
            cropAreaStyle: { 
              border: '2px solid rgba(255,255,255,0.7)', 
              boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.65)',
              borderRadius: '8px'
            }
          }}
        />
      </div>

      {/* Footer Controls */}
      <div className="w-full p-10 bg-gradient-to-t from-black to-transparent flex flex-col items-center gap-6 z-20">
        <div className="flex items-center gap-3 text-white/40 animate-pulse">
          <Move size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.15em]">Arraste para mover • Pinça para zoom</span>
        </div>
        
        <div className="flex items-center gap-6 w-full max-w-sm">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 bg-zinc-900 text-zinc-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800 active:scale-95"
          >
            Cancelar
          </button>
          
          <button 
            type="button"
            onClick={handleConfirm}
            className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
