const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const intro = document.querySelector<HTMLElement>('.intro-screen');
function finishIntro() {
  delete document.documentElement.dataset.intro;
}
intro?.addEventListener('animationend', (event) => {
  if (event.target === intro) finishIntro();
});
document.querySelector('[data-skip-intro]')?.addEventListener('click', finishIntro);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' || event.key === 'Tab') finishIntro();
});
// A fail-safe also releases the intro if an animation is interrupted.
window.setTimeout(finishIntro, 1900);
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) finishIntro();
});

const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const header = document.querySelector<HTMLElement>('.site-header');
function setMenu(open: boolean) {
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  header?.classList.toggle('menu-open', open);
}
menuButton?.addEventListener('click', () => setMenu(menuButton?.getAttribute('aria-expanded') !== 'true'));
document.querySelectorAll('#primary-navigation a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (event) => {
  if (event.target instanceof Node && !header?.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 1001px)').addEventListener('change', () => setMenu(false));
function updateHeader() { header?.classList.toggle('is-scrolled', window.scrollY > 32); }
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const targetDate = new Date('2027-09-18T06:00:00+02:00').getTime();
const countdownElements = ['days', 'hours', 'minutes', 'seconds'].map(unit => document.querySelector<HTMLElement>(`[data-countdown="${unit}"]`));
function updateCountdown() {
  const remaining = Math.max(0, targetDate - Date.now());
  const values = [Math.floor(remaining / 86_400_000), Math.floor(remaining % 86_400_000 / 3_600_000), Math.floor(remaining % 3_600_000 / 60_000), Math.floor(remaining % 60_000 / 1_000)];
  countdownElements.forEach((element, index) => {
    if (element) element.textContent = String(values[index]).padStart(index === 0 ? 3 : 2, '0');
  });
  if (remaining === 0) {
    const heading = document.querySelector('#countdown-heading');
    if (heading) heading.textContent = 'Le départ a été donné';
  }
}
updateCountdown();
let countdownTimer = window.setInterval(updateCountdown, 1000);
document.addEventListener('visibilitychange', () => {
  window.clearInterval(countdownTimer);
  if (!document.hidden) {
    updateCountdown();
    countdownTimer = window.setInterval(updateCountdown, 1000);
  }
});

const toursInput = document.querySelector<HTMLInputElement>('#toursInput');
const resTours = document.querySelector<HTMLOutputElement>('#resTours');
const resKm = document.querySelector('#resKm');
const resDenivele = document.querySelector('#resDenivele');
const resHours = document.querySelector('#resHours');
const numberFormat = new Intl.NumberFormat('fr-FR');
const decimalFormat = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function updateCalculator() {
  const tours = Number(toursInput?.value ?? 12);
  if (resTours) resTours.textContent = String(tours);
  if (resKm) resKm.textContent = decimalFormat.format(tours * 6.706);
  if (resDenivele) resDenivele.textContent = numberFormat.format(tours * 240);
  if (resHours) resHours.textContent = String(tours);
  toursInput?.style.setProperty('--range-progress', `${(tours - 1) / 99 * 100}%`);
  toursInput?.setAttribute('aria-valuetext', `${tours} tours, ${decimalFormat.format(tours * 6.706)} kilomètres, ${numberFormat.format(tours * 240)} mètres de dénivelé positif`);
  document.querySelectorAll<HTMLButtonElement>('[data-laps]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.laps) === tours)));
}
toursInput?.addEventListener('input', updateCalculator);
document.querySelectorAll<HTMLButtonElement>('[data-laps]').forEach(button => button.addEventListener('click', () => {
  if (toursInput) toursInput.value = button.dataset.laps ?? '12';
  updateCalculator();
}));
updateCalculator();

for (const name of ['rules', 'registration', 'live']) {
  const dialog = document.querySelector<HTMLDialogElement>(`#${name}Dialog`);
  document.querySelectorAll(`[data-open-${name}]`).forEach(button => button.addEventListener('click', () => {
    setMenu(false);
    dialog?.showModal();
  }));
  document.querySelectorAll(`[data-close-${name}]`).forEach(button => button.addEventListener('click', () => dialog?.close()));
  dialog?.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
}

// Enhancement only: content is visible when JS or observers are unavailable.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.loop-step, .poster-copy, .calculator-card, .info-card, .final-cta-layout').forEach(element => {
    element.classList.add('reveal');
    observer.observe(element);
  });
}
