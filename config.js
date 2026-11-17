const path = require('path');
const { app } = require('electron');

// Pasta Downloads real do Windows (respeita caso o usuário a tenha movido).
const downloads = app.getPath('downloads');

module.exports = {
  // Atalho global para abrir/recolher o overlay.
  hotkey: 'Alt+X',

  // Pastas observadas (somente o nível raiz de cada uma, sem subpastas).
  // Para incluir os prints do Windows, adicione: path.join(app.getPath('pictures'), 'Screenshots')
  watchDirs: [downloads],

  // Onde os WebP otimizados são salvos. Fica FORA do nível observado,
  // então o app nunca reprocessa o que ele mesmo gerou.
  outputDir: path.join(downloads, 'Otimizadas'),

  // Começa ativo ao abrir o app?
  startActive: true,

  // Apagar a imagem original depois de otimizar? (false = mantém o original)
  deleteOriginal: false,

  webp: {
    // true = tenta SEMPRE primeiro a conversão sem perdas (lossless).
    lossless: true,

    // Se o lossless ficar MAIOR que o original (comum em JPEG/AVIF, que já são com perdas),
    // usa o modo com perdas abaixo em vez de aumentar o arquivo. Essas imagens aparecem
    // com a etiqueta "com perdas" no histórico.
    // Use false para manter sempre lossless, mesmo que o arquivo cresça.
    allowLossyFallback: true,

    // Qualidade (1-100) do modo com perdas. Só é usada no fallback ou se lossless = false.
    // Valores acima de ~85 tendem a deixar JPEGs comuns MAIORES que o original.
    quality: 80,

    // 0-6 (maior = arquivo menor, porém mais lento).
    effort: 6,
  },

  // Largura máxima em pixels (null = não redimensiona). Nunca aumenta imagens pequenas.
  // Atenção: redimensionar deixa a conversão de ser lossless em relação ao original.
  maxWidth: null,

  // Quantidade de caracteres do hash no início do nome do arquivo.
  hashLength: 10,

  // Quantidade máxima de itens guardados no histórico do painel.
  historyLimit: 200,

  // Extensões de entrada. .webp fica de fora de propósito.
  extensions: ['.png', '.jpg', '.jpeg', '.jfif', '.bmp', '.tif', '.tiff', '.gif', '.avif'],

  // Arquivos temporários de download dos navegadores.
  ignoredSuffixes: ['.crdownload', '.part', '.tmp', '.opdownload', '.download'],
};
