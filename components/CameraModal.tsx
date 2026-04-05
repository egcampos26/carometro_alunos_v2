import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface CameraModalProps {
    onCapture: (blob: Blob) => void;
    onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setError(null);
            
            // 1. Verificação de contexto seguro
            if (!window.isSecureContext) {
                setError("O acesso à câmera requer uma conexão segura (HTTPS) ou localhost. Verique o endereço no navegador.");
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Seu navegador não suporta acesso à câmera ou a funcionalidade está bloqueada.");
                return;
            }

            // 2. Tentar primeiro a câmera traseira (environment) com constraints ideais
            let mediaStream: MediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
            } catch (firstErr) {
                console.warn("Falha ao abrir câmera traseira, tentando qualquer câmera disponível:", firstErr);
                // 3. Fallback: Qualquer câmera de vídeo disponível
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
            }

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setIsCameraReady(true);
        } catch (err: any) {
            console.error("Erro ao acessar câmera:", err);
            
            // 4. Mapeamento de erros comuns em português
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError("Permissão negada. Por favor, autorize o uso da câmera nas configurações do navegador.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setError("Nenhuma câmera foi encontrada no seu dispositivo.");
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                setError("A câmera está sendo usada por outro aplicativo ou aba.");
            } else {
                setError(`Erro ao acessar câmera: ${err.message || 'Verifique as permissões do navegador.'}`);
            }
            setIsCameraReady(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Definimos o canvas como quadrado baseado no menor lado do vídeo
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        // Calculamos o centro para o crop quadrado
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        // Desenha o frame atual no canvas
        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);

        // Converte para blob e preview
        canvas.toBlob((blob) => {
            if (blob) {
                setCapturedBlob(blob);
                setCapturedImage(canvas.toDataURL('image/webp'));
                stopCamera();
            }
        }, 'image/webp', 0.85);
    };

    const handleConfirm = () => {
        if (capturedBlob) {
            onCapture(capturedBlob);
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setCapturedBlob(null);
        startCamera();
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center animate-fade-in">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                <button onClick={onClose} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                    <X size={24} />
                </button>
                <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                    Câmera Carômetro
                </div>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Viewport */}
            <div className="relative w-full max-w-md aspect-square bg-zinc-900 border-x border-zinc-800 overflow-hidden shadow-2xl">
                {!capturedImage ? (
                    <>
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover scale-x-[-1] md:scale-x-1" 
                        />
                        
                        {/* Máscara de Enquadramento */}
                        {isCameraReady && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                                <div className="w-full aspect-[4/5] border-2 border-white/40 border-dashed rounded-[50%] opacity-60"></div>
                                <p className="mt-8 text-white/80 font-black text-[10px] uppercase tracking-[0.2em] bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                                    Enquadre o rosto no círculo
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-zinc-900/95 backdrop-blur-sm z-30">
                                <AlertTriangle className="text-amber-500 mb-4" size={48} />
                                <p className="text-white font-bold text-sm mb-6">{error}</p>
                                <button 
                                    onClick={startCamera}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw size={14} />
                                    Tentar Novamente
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-12 bg-gradient-to-t from-black via-black/80 to-transparent">
                {!capturedImage ? (
                    <button 
                        onClick={handleCapture}
                        disabled={!isCameraReady}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg active:scale-90 transition-transform disabled:opacity-30"
                    >
                        <div className="w-16 h-16 bg-white border-2 border-black/10 rounded-full flex items-center justify-center">
                            <Camera size={32} className="text-zinc-900" />
                        </div>
                    </button>
                ) : (
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handleRetake}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-white border border-zinc-700 group-active:bg-zinc-700 transition-colors shadow-lg">
                                <RefreshCw size={22} />
                            </div>
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Tentar Novamente</span>
                        </button>
                        
                        <button 
                            onClick={handleConfirm}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white border border-blue-500 group-active:bg-blue-700 transition-colors shadow-lg">
                                <Check size={28} />
                            </div>
                            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Confirmar Foto</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden Canvas for capture processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraModal;
