/**
 * Comprime uma imagem para WebP 400×400px usando Canvas API.
 * Qualidade: 0.78 → resultado típico de 15–55 KB por foto.
 */
export async function compressToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const TARGET_SIZE = 400;

            // Calcula crop centrado (cover)
            const srcRatio = img.width / img.height;
            let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

            if (srcRatio > 1) {
                // Imagem mais larga que alta: recorta largura (centralizado)
                srcW = img.height;
                srcX = (img.width - srcW) / 2;
            } else {
                // Imagem mais alta que larga: recorta altura (favorecendo o topo - 15%)
                srcH = img.width;
                // Em vez de centralizar (/ 2), usamos 15% da sobra para o topo
                srcY = (img.height - srcH) * 0.15;
            }

            const canvas = document.createElement('canvas');
            canvas.width = TARGET_SIZE;
            canvas.height = TARGET_SIZE;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, TARGET_SIZE, TARGET_SIZE);

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
 * Cria um Blob WebP a partir de uma imagem e coordenadas de corte.
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

    const TARGET_SIZE = 400;
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        TARGET_SIZE,
        TARGET_SIZE
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
