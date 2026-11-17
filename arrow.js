const tab = document.getElementById('tab');

tab.addEventListener('click', () => window.api.expand());

function render({ active }) {
  tab.classList.toggle('on', active);
}

window.api.onState(render);
window.api.getState().then(render);
