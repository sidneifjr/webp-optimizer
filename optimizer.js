const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');
const sharp = require('sharp');

// No Windows o cache de arquivos do sharp pode manter arquivos travados.
sharp.cache(false);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Antivírus ou o próprio navegador às vezes seguram o arquivo por instantes.
async function readWithRetry(file, attempts = 5) {
  for (let i = 1; ; i++) {
    try {
      return await fsp.readFile(file);
    } catch (err) {
      const transient = ['EBUSY', 'EPERM', 'EACCES'].includes(err.code);
      if (!transient || i >= attempts) throw err;
      await sleep(500 * i);
    }
  }
}

async function exists(file) {
  try {
    await fsp.access(file);
    return true;
  } catch {
    return false;
  }
}

function createOptimizer(config, { onResult = () => {}, log = console.log } = {}) {
  let watcher = null;
  const inFlight = new Set();

  const hasSuffix = (file) => {
    const lower = file.toLowerCase();
    return config.ignoredSuffixes.some((suffix) => lower.endsWith(suffix));
  };

  async function optimize(file) {
    if (inFlight.has(file)) return;
    inFlight.add(file);

    try {
      const ext = path.extname(file).toLowerCase();
      const baseName = path.parse(file).name;
      const animated = ext === '.gif';

      // Lê para memória: o sharp não segura o arquivo original aberto.
      const input = await readWithRetry(file);

      let pipeline = sharp(input, { animated });
      if (!animated) pipeline = pipeline.rotate(); // aplica orientação EXIF (metadados são removidos)
      if (config.maxWidth) {
        pipeline = pipeline.resize({ width: config.maxWidth, withoutEnlargement: true });
      }

      const output = await pipeline.webp(config.webp).toBuffer();

      const hash = crypto
        .createHash('sha256')
        .update(output)
        .digest('hex')
        .slice(0, config.hashLength);

      const outName = `${hash}_${baseName}.webp`;
      const outPath = path.join(config.outputDir, outName);

      await fsp.mkdir(config.outputDir, { recursive: true });

      if (await exists(outPath)) {
        log(`[skip] ${path.basename(file)} -> ${outName} (já existe)`);
      } else {
        // Escreve em temporário e renomeia, para nunca deixar arquivo pela metade.
        const tmpPath = `${outPath}.tmp`;
        await fsp.writeFile(tmpPath, output);
        await fsp.rename(tmpPath, outPath);

        const saved = Math.round((1 - output.length / input.length) * 100);
        log(`[ok] ${path.basename(file)} -> ${outName} (${saved}% menor)`);
      }

      if (config.deleteOriginal) await fsp.unlink(file);

      onResult({ ok: true, input: file, output: outPath });
    } catch (err) {
      log(`[erro] ${path.basename(file)}: ${err.message}`);
      onResult({ ok: false, input: file, error: err });
    } finally {
      inFlight.delete(file);
    }
  }

  function handleAdd(file) {
    if (hasSuffix(file)) return;
    const ext = path.extname(file).toLowerCase();
    if (!config.extensions.includes(ext)) return;
    optimize(file);
  }

  function start() {
    if (watcher) return;
    watcher = chokidar.watch(config.watchDirs, {
      ignoreInitial: true, // não processa o que já estava na pasta
      depth: 0,            // somente a raiz de cada pasta
      ignored: (p) => hasSuffix(p),
      awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 200 },
    });
    watcher.on('add', handleAdd);
    watcher.on('error', (err) => log(`[watcher] ${err.message}`));
    log(`[watcher] ativo em: ${config.watchDirs.join(', ')}`);
  }

  async function stop() {
    if (!watcher) return;
    const current = watcher;
    watcher = null;
    await current.close();
    log('[watcher] desativado');
  }

  return { start, stop, isRunning: () => watcher !== null };
}

module.exports = { createOptimizer };
