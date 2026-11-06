# We Hug Now

Prima un messaggio a blocchi che compaiono e scompaiono, poi il video al centro con il
testo della canzone che scorre a tempo con la voce.

## Provarlo in locale

```bash
node server.js
```

Il server stampa l'indirizzo per il computer e quello per il telefono sulla stessa Wi-Fi.
Aggiungendo `#video` all'indirizzo si saltano le frasi iniziali.

## Deploy

Il sito è statico: basta pubblicare la cartella, senza passaggi di build.
`server.js` serve solo per provarlo in locale.

## File

- `video.mp4`: il video compresso per il web (720p)
- `frasi.json`: le frasi iniziali, come elenco di stringhe
- `lyrics.txt`: il testo della canzone, una riga per ogni riga cantata (16 in tutto).
  Senza questo file, online si vede solo il video.
- `timings.json`: il secondo di inizio e di fine di ogni riga di `lyrics.txt`.
  Se una riga parte troppo presto o troppo tardi basta cambiare il suo `start`.
