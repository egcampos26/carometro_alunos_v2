import { supabase } from './supabase';

const BUCKET = 'fotos-alunos';

/**
 * Sanitiza grade + nome do aluno para um nome de arquivo seguro.
 * Exemplo: grade="1 A", name="João da Silva" → "1A - João da Silva.webp"
 */
export function buildPhotoFileName(grade: string, name: string): string {
    const sanitized = (str: string) =>
        str
            .normalize('NFC')           // mantém acentos (são válidos no Storage)
            .replace(/[\\/:*?"<>|]/g, '') // remove caracteres inválidos em nomes de arquivo
            .trim();

    const gradeClean = sanitized(grade).replace(/\s+/g, ''); // "1 A" → "1A"
    const nameClean = sanitized(name);
    return `${gradeClean} - ${nameClean}.webp`;
}

/**
 * Faz upload de um Blob WebP para o Supabase Storage.
 * Caminho: fotos-alunos/{grade} - {nome do aluno}.webp
 * Retorna a URL pública permanente.
 */
export async function uploadStudentPhoto(
    grade: string,
    name: string,
    blob: Blob
): Promise<string> {
    const filePath = buildPhotoFileName(grade, name);

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, blob, {
            contentType: 'image/webp',
            upsert: true, // Substitui se já existir
        });

    if (error) {
        throw new Error(`Falha ao fazer upload da foto: ${error.message}`);
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

/**
 * Remove a foto de um aluno do bucket de Storage pelo nome do arquivo.
 */
export async function deleteStudentPhoto(grade: string, name: string): Promise<void> {
    const filePath = buildPhotoFileName(grade, name);
    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

    if (error) {
        console.warn(`Não foi possível remover a foto:`, error.message);
    }
}
