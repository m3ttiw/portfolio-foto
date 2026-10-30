// "Coming soon": i link della pagina per Alessia non portano ancora da
// nessuna parte. Al passaggio (o al tocco) compare un fumetto.
export function comingSoon(root) {
  const links = root.querySelectorAll('[data-soon]');
  links.forEach((a) => {
    a.setAttribute('aria-disabled', 'true');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      a.classList.add('is-soon');
      clearTimeout(a.soonTimer);
      a.soonTimer = setTimeout(() => a.classList.remove('is-soon'), 1600);
    });
  });
}

// Fumetto libero, per il click sulle foto della scena.
export function soonBubble() {
  const el = document.createElement('div');
  el.className = 'soon-bubble';
  el.setAttribute('role', 'status');
  document.body.append(el);
  let timer;
  return (project, e) => {
    el.textContent = `${project.title}: coming soon`;
    el.style.left = `${e.clientX}px`;
    el.style.top = `${e.clientY}px`;
    el.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('is-on'), 1600);
  };
}
