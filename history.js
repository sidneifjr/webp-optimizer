const fs = require('fs');
const path = require('path');

// Histórico persistente (JSON em disco). Os itens mais novos ficam primeiro.
function createHistory(file, limit = 200) {
  let items = [];
  let timer = null;

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(parsed)) items = parsed.slice(0, limit);
  } catch {
    // Arquivo ainda não existe ou está corrompido: começa vazio.
  }

  function writeNow() {
    clearTimeout(timer);
    timer = null;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(items));
      fs.renameSync(tmp, file);
    } catch {
      // Falha ao salvar não deve derrubar o app; o histórico segue em memória.
    }
  }

  // Agrupa várias alterações seguidas em uma única escrita.
  function scheduleWrite() {
    clearTimeout(timer);
    timer = setTimeout(writeNow, 300);
  }

  return {
    list: () => items,

    add(entry) {
      items.unshift(entry);
      if (items.length > limit) items.length = limit;
      scheduleWrite();
    },

    clear() {
      items = [];
      scheduleWrite();
    },

    // Chamar ao encerrar o app, para não perder a última alteração.
    flushSync: writeNow,
  };
}

module.exports = { createHistory };
