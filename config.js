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
    quality: 80, // 1-100
    effort: 4,   // 0-6 (maior = arquivo menor, porém mais lento)
  },

  // Largura máxima em pixels (null = não redimensiona). Nunca aumenta imagens pequenas.
  maxWidth: null,

  // Quantidade de caracteres do hash no início do nome do arquivo.
  hashLength: 10,

  // Extensões de entrada. .webp fica de fora de propósito.
  extensions: ['.png', '.jpg', '.jpeg', '.jfif', '.bmp', '.tif', '.tiff', '.gif', '.avif'],

  // Arquivos temporários de download dos navegadores.
  ignoredSuffixes: ['.crdownload', '.part', '.tmp', '.opdownload', '.download'],
};
