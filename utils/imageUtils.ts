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
                // Imagem mais larga que alta: recorta largura
                srcW = img.height;
                srcX = (img.width - srcW) / 2;
            } else {
                // Imagem mais alta que larga: recorta altura
                srcH = img.width;
                srcY = (img.height - srcH) / 2;
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
