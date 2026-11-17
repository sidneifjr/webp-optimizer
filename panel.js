const $ = (id) => document.getElementById(id);

function render({ active, processed }) {
  $('status').textContent = active ? 'Ativo' : 'Desativado';
  $('count').textContent = processed;
  $('dot').classList.toggle('on', active);

  const button = $('toggle');
  button.textContent = active ? 'Desativar' : 'Ativar';
  button.classList.toggle('is-off', !active);
}

$('toggle').addEventListener('click', () => window.api.toggleActive());
$('collapse').addEventListener('click', () => window.api.collapse());
$('quit').addEventListener('click', () => window.api.quit());

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') window.api.collapse();
});

window.api.onState(render);
window.api.getState().then(render);
