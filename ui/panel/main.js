const $ = (id) => document.getElementById(id);

const numberFormat = (digits) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const oneDecimal = numberFormat(1);
const twoDecimals = numberFormat(2);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${oneDecimal.format(bytes / 1024)} KB`;
  return `${twoDecimals.format(bytes / (1024 * 1024))} MB`;
}

// Percentual de espaço liberado em relação ao original (negativo = o arquivo cresceu).
function savedPercent(item) {
  if (!item.originalSize) return 0;
  return (1 - item.optimizedSize / item.originalSize) * 100;
}

function textCell(text, className) {
  const td = document.createElement('td');
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

// Nomes de arquivo vêm do disco: sempre textContent, nunca innerHTML.
function buildRow(item) {
  const tr = document.createElement('tr');
  tr.title = `${item.name} → ${item.outputName}\n${new Date(item.at).toLocaleString('pt-BR')}`;

  const nameTd = document.createElement('td');
  const wrap = document.createElement('div');
  wrap.className = 'namecell';

  const fileName = document.createElement('span');
  fileName.className = 'fname';
  fileName.textContent = item.name;
  wrap.append(fileName);

  if (item.mode === 'lossy') {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'com perdas';
    tag.title = 'O lossless ficaria maior que o original, então foi usado o modo com perdas.';
    wrap.append(tag);
  }
  nameTd.append(wrap);

  const percent = savedPercent(item);
  tr.append(
    nameTd,
    textCell(formatBytes(item.originalSize), 'num'),
    textCell(formatBytes(item.optimizedSize), 'num'),
    textCell(`${oneDecimal.format(percent)}%`, percent > 0 ? 'num gain' : 'num loss')
  );
  return tr;
}

function renderHistory(items) {
  $('rows').replaceChildren(...items.map(buildRow));
  $('empty').hidden = items.length > 0;
  $('clear').disabled = items.length === 0;
}

function renderState({ active, count }) {
  const label = active ? 'Ativo' : 'Desativado';
  $('summary').textContent = `${label} · ${count} ${count === 1 ? 'otimizada' : 'otimizadas'}`;
  $('dot').classList.toggle('on', active);

  const button = $('toggle');
  button.textContent = active ? 'Desativar' : 'Ativar';
  button.classList.toggle('is-off', !active);
}

$('toggle').addEventListener('click', () => window.api.toggleActive());
$('collapse').addEventListener('click', () => window.api.collapse());
$('clear').addEventListener('click', () => window.api.clearHistory());
$('quit').addEventListener('click', () => window.api.quit());

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') window.api.collapse();
});

window.api.onState(renderState);
window.api.onHistory(renderHistory);
window.api.getState().then(renderState);
window.api.getHistory().then(renderHistory);
