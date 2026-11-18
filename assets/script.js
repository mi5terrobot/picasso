// 1. Formeln rendern (nur wenn Temml geladen wurde)
if (window.temml) {
  document.querySelectorAll('.tex').forEach(el => temml.render(el.textContent, el));
}

const inhalt = document.getElementById('inhalt');
const toc = document.getElementById('toc');
const sections = document.querySelectorAll('main section');

// 2. Jede Section aufbauen: Inhaltsverzeichnis, ✕-Link, Schritte und Navigation
sections.forEach(sec => {
  const titel = sec.querySelector('h2');
  toc.insertAdjacentHTML('beforeend',
    `<li><a href="#${sec.id}">${titel.innerHTML.replace(/<br\s*\/?>/gi, ' ')}</a></li>`);
  titel.innerHTML = `<span>${titel.innerHTML}</span>` +
    `<a href="#" class="schliessen" aria-label="Zum Inhaltsverzeichnis">✕</a>`;

  // Schritte in einen Rahmen packen und Navigation darunter setzen
  const schritte = [...sec.querySelectorAll('.schritt')];
  if (!schritte.length) return;
  const rahmen = document.createElement('div');
  rahmen.className = 'schritte';
  schritte[0].before(rahmen);
  rahmen.append(...schritte);

  rahmen.insertAdjacentHTML('afterend', `
    <div class="navigation">
      <button type="button" class="pfeil zurueck" aria-label="Zurück">‹</button>
      <span class="punkte">${schritte.map((_, i) =>
        `<button type="button" class="punkt" aria-label="Schritt ${i + 1}"></button>`).join('')}</span>
      <button type="button" class="pfeil weiter" aria-label="Weiter">›</button>
    </div>`);

  const zurueck = sec.querySelector('.navigation .zurueck');
  const weiter = sec.querySelector('.navigation .weiter');
  const punkte = [...sec.querySelectorAll('.navigation .punkt')];
  let aktuell = 0;

  // Punkte und Buttons an den aktuellen Schritt anpassen
  function markiere() {
    aktuell = Math.round(rahmen.scrollLeft / rahmen.clientWidth) || 0;
    punkte.forEach((p, j) => {
      p.classList.toggle('aktiv', j === aktuell);
      p.toggleAttribute('aria-current', j === aktuell);
    });
    zurueck.disabled = aktuell === 0;
    weiter.disabled = aktuell === schritte.length - 1;
  }

  // Zu Schritt i scrollen (beim Wischen passiert das von selbst)
  sec.zeige = (i, behavior = 'smooth') => {
    rahmen.scrollTo({ left: i * rahmen.clientWidth, behavior });
    markiere();
  };

  rahmen.addEventListener('scroll', markiere);
  zurueck.onclick = () => sec.zeige(aktuell - 1);
  weiter.onclick = () => sec.zeige(aktuell + 1);
  punkte.forEach((p, i) => { p.onclick = () => sec.zeige(i); });
});

// 3. Ansicht je nach Hash umschalten (Section startet immer bei Schritt 1)
function zeigeAnsicht() {
  const ziel = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const istSection = [...sections].includes(ziel);

  inhalt.hidden = istSection;
  sections.forEach(sec => { sec.hidden = sec !== ziel; });
  if (istSection) ziel.zeige(0, 'instant');
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', zeigeAnsicht);
window.addEventListener('popstate', zeigeAnsicht);
zeigeAnsicht();

// ✕-Link: zurück zum Inhaltsverzeichnis ohne "#" in der Adresse
document.addEventListener('click', e => {
  if (!e.target.closest('.schliessen')) return;
  e.preventDefault();
  history.pushState(null, '', location.pathname);
  zeigeAnsicht();
});

// 4. Datum der letzten Änderung im Footer (Format: DD/MM/YYYY, hh:mm)
const d = new Date(document.lastModified);
const aktualisiert = document.getElementById('aktualisiert');
aktualisiert.dateTime = d.toISOString();
aktualisiert.textContent = d.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
