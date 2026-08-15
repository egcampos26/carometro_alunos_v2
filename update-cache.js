import { createClient } from '@supabase/supabase-js';

// As variáveis do .env serão carregadas pelo comando do Node.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BUCKET = 'fotos-alunos';

async function main() {
    console.log("🔍 Buscando lista de fotos no bucket...");
    
    // 1. Listar todas as fotos (usando paginação simples se houver menos de 1000)
    const { data: files, error: listError } = await supabase.storage.from(BUCKET).list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
    });

    if (listError) {
        console.error("❌ Erro ao listar arquivos:", listError);
        return;
    }

    if (!files || files.length === 0) {
        console.log("Nenhuma foto encontrada no bucket.");
        return;
    }

    console.log(`✅ Encontradas ${files.length} fotos. Iniciando atualização de Cache-Control...\n`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Para cada foto, baixar e fazer o re-upload com cacheControl = 1 ano
    for (const file of files) {
        // Ignora pastas ou o arquivo oculto .emptyFolderPlaceholder se houver
        if (file.name.startsWith('.') || !file.name.endsWith('.webp')) continue;

        try {
            process.stdout.write(`⏳ Atualizando: ${file.name}... `);

            // A. Baixar a imagem
            const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(file.name);
            if (downloadError) throw downloadError;

            // B. Re-upload (sobrescrever) aplicando a política nova de cache
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(file.name, blob, {
                contentType: 'image/webp',
                upsert: true,
                cacheControl: '31536000' // <-- O MÁGICO: Cache de 1 ano
            });

            if (uploadError) throw uploadError;

            console.log("✅ OK");
            successCount++;
        } catch (err) {
            console.log(`❌ ERRO: ${err.message || err}`);
            errorCount++;
        }
    }

    console.log(`\n🎉 Processo concluído!`);
    console.log(`Atualizadas com sucesso: ${successCount}`);
    if (errorCount > 0) console.log(`Falhas: ${errorCount}`);
}

main();
