// La riga si accende appena prima della voce: chi guarda deve leggerla mentre la sente.
const ANTICIPO = 0.15;
// Dopo la fine di una riga resta accesa ancora un po', come la voce che si spegne.
const TENUTA = 0.6;
// Con una pausa più lunga di questa il testo sale già sulla riga successiva, ancora spenta.
const PAUSA_LUNGA = 3;

// Frasi iniziali, in millisecondi. DISSOLVENZA è la stessa di #frase in style.css.
const DISSOLVENZA = 900;
const LETTURA_BASE = 1300;
const LETTURA_PER_CARATTERE = 50;
const STACCO = 250;
const TENUTA_ULTIMA_FRASE = 1500;

const video = document.getElementById('video');
const testo = document.getElementById('testo');
const lista = document.getElementById('righe');
const avviso = document.getElementById('avviso');
const frase = document.getElementById('frase');
const play = document.getElementById('play');

// Riga da mettere al centro e riga da accendere al secondo `t`.
function statoAl(t, tempi) {
  let i = -1;
  for (let n = 0; n < tempi.length && tempi[n].start - ANTICIPO <= t; n++) i = n;

  if (i === -1) return { centro: 0, accesa: -1 };

  const successiva = tempi[i + 1];
  if (t <= tempi[i].end + TENUTA) return { centro: i, accesa: i };
  if (!successiva) return { centro: i, accesa: -1 };

  const pausa = successiva.start - tempi[i].end;
  return pausa > PAUSA_LUNGA ? { centro: i + 1, accesa: -1 } : { centro: i, accesa: i };
}

function creaRighe(tempi, righeTesto) {
  return tempi.map(({ line, start }) => {
    const voce = document.createElement('li');
    const bottone = document.createElement('button');
    bottone.type = 'button';
    bottone.className = 'riga';
    bottone.textContent = righeTesto[line - 1] ?? '';
    bottone.addEventListener('click', (evento) => {
      video.currentTime = start;
      video.play();
      // Col mouse il focus non deve restare qui, o la barra spaziatrice ripeterebbe la riga.
      if (evento.detail > 0) bottone.blur();
    });
    voce.append(bottone);
    lista.append(voce);
    return bottone;
  });
}

// Gli avvisi servono a chi prepara il sito: online, senza testo, resta solo il video.
function mostraAvviso(messaggio) {
  if (!['localhost', '127.0.0.1'].includes(location.hostname)) return;
  avviso.textContent = messaggio;
  avviso.hidden = false;
}

async function avvia() {
  const [{ lines: tempi }, contenuto] = await Promise.all([
    fetch('timings.json').then((r) => r.json()),
    fetch('lyrics.txt').then((r) => (r.ok ? r.text() : '')),
  ]);

  const righeTesto = contenuto
    .split(/\r?\n/)
    .map((riga) => riga.trim())
    .filter(Boolean);

  if (righeTesto.length === 0) {
    mostraAvviso('Incolla il testo in lyrics.txt e ricarica la pagina.');
    return;
  }

  const attese = Math.max(...tempi.map((t) => t.line));
  if (righeTesto.length !== attese) {
    mostraAvviso(`lyrics.txt ha ${righeTesto.length} righe, ma i tempi sono per ${attese}.`);
    return;
  }

  const righe = creaRighe(tempi, righeTesto);
  let corrente = { centro: -1, accesa: -1 };

  function centra() {
    const riga = righe[corrente.centro];
    const y = testo.clientHeight / 2 - (riga.offsetTop + riga.offsetHeight / 2);
    lista.style.transform = `translate3d(0, ${y}px, 0)`;
  }

  function aggiorna() {
    const stato = statoAl(video.currentTime, tempi);
    if (stato.accesa !== corrente.accesa) {
      righe[corrente.accesa]?.removeAttribute('aria-current');
      righe[stato.accesa]?.setAttribute('aria-current', 'true');
    }
    const siSposta = stato.centro !== corrente.centro;
    corrente = stato;
    if (siSposta) centra();
    requestAnimationFrame(aggiorna);
  }

  // Le righe vanno a capo in modo diverso a ogni larghezza: le misure si rifanno.
  new ResizeObserver(() => {
    if (corrente.centro >= 0) centra();
  }).observe(testo);

  aggiorna();
}

function attesa(millisecondi) {
  return new Promise((risolvi) => setTimeout(risolvi, millisecondi));
}

async function mostraFrasi() {
  const frasi = await fetch('frasi.json')
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);

  for (const [indice, testoFrase] of frasi.entries()) {
    const ultima = indice === frasi.length - 1;
    frase.textContent = testoFrase;
    // Un fotogramma con il testo nuovo ancora trasparente, o la dissolvenza non parte.
    await attesa(50);
    frase.classList.add('visibile');
    await attesa(
      DISSOLVENZA +
        LETTURA_BASE +
        testoFrase.length * LETTURA_PER_CARATTERE +
        (ultima ? TENUTA_ULTIMA_FRASE : 0),
    );
    frase.classList.remove('visibile');
    await attesa(DISSOLVENZA + STACCO);
  }
}

function mostraVideo() {
  document.body.classList.add('film');
  // I browser bloccano l'audio automatico se la pagina non ha ancora ricevuto un tocco:
  // in quel caso resta il video fermo con il pulsante di play ben visibile.
  video.play().catch(() => {
    play.hidden = false;
  });
}

play.addEventListener('click', () => video.play());
video.addEventListener('play', () => {
  play.hidden = true;
});

document.addEventListener('keydown', (evento) => {
  if (evento.code !== 'Space' || evento.target.closest('button')) return;
  if (!document.body.classList.contains('film')) return;
  evento.preventDefault();
  if (video.paused) video.play();
  else video.pause();
});

avvia();

// http://localhost:4321/#video salta le frasi: comodo per ricontrollare la sincronia.
if (location.hash === '#video') mostraVideo();
else mostraFrasi().then(mostraVideo);
