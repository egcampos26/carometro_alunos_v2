/**
 * Comprime uma imagem para WebP 450×600px (3:4) usando Canvas API.
 * Qualidade: 0.78 → resultado típico de 20–70 KB por foto.
 */
export async function compressToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const TARGET_WIDTH = 450;
            const TARGET_HEIGHT = 600;

            // Calcula crop centrado 3:4
            const srcRatio = img.width / img.height;
            const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
            
            let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

            if (srcRatio > targetRatio) {
                // Imagem muito larga: corta largura
                srcW = img.height * targetRatio;
                srcX = (img.width - srcW) / 2;
            } else {
                // Imagem muito alta: corta altura (favorecendo o topo 15%)
                srcH = img.width / targetRatio;
                srcY = (img.height - srcH) * 0.15;
            }

            const canvas = document.createElement('canvas');
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Falha ao comprimir imagem'));
                    }
                },
                'image/webp',
                0.78
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Falha ao carregar imagem'));
        };

        img.src = objectUrl;
    });
}

/**
 * Cria um Blob WebP 3:4 a partir de uma imagem e coordenadas de corte.
 * Utilizado pelo componente de ajuste manual.
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img));
        img.addEventListener('error', (err) => reject(err));
        img.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D context não disponível');
    }

    // Definimos saída fixa em 3:4 (450x600) para manter padrão e consistência
    const TARGET_WIDTH = 450;
    const TARGET_HEIGHT = 600;
    
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        TARGET_WIDTH,
        TARGET_HEIGHT
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Falha ao gerar o blob de corte'));
                }
            },
            'image/webp',
            0.78
        );
    });
}
