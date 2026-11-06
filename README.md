# We Hug Now

Sito locale: prima un messaggio a blocchi che compaiono e scompaiono, poi il video
al centro con il testo della canzone che scorre a tempo con la voce.

## Avvio

```bash
node server.js
```

Il server stampa l'indirizzo per il computer e quello per il telefono sulla stessa Wi-Fi.
Aggiungendo `#video` all'indirizzo si saltano le frasi iniziali.

## File che non sono nella repo

La repo è pubblica, quindi questi file restano solo sul Mac:

- `video.mp4`: il video, in MP4
- `lyrics.txt`: il testo della canzone, una riga per ogni riga cantata (16 in tutto)
- `frasi.json`: le frasi iniziali, come elenco di stringhe

## Correggere la sincronia

`timings.json` ha il secondo di inizio e di fine di ogni riga di `lyrics.txt`.
Se una riga parte troppo presto o troppo tardi basta cambiare il suo `start` e ricaricare.
