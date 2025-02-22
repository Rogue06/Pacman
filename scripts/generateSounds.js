const { AudioContext } = require("web-audio-api");
const fs = require("fs");
const path = require("path");

const audioContext = new AudioContext();
const sampleRate = 44100;
const soundsDir = path.join(__dirname, "../dist/assets/sounds");

// Créer le dossier des sons s'il n'existe pas
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Fonction utilitaire pour générer un buffer audio
function createBuffer(duration, channels = 1) {
  return audioContext.createBuffer(channels, duration * sampleRate, sampleRate);
}

// Fonction pour sauvegarder le buffer en fichier WAV
function saveBufferToWav(buffer, filename) {
  // Code de conversion du buffer en WAV
  const wavData = // ... conversion en WAV ...
    fs.writeFileSync(path.join(soundsDir, filename), wavData);
}

// Générer le son "waka-waka"
function generateWakaWaka() {
  const duration = 0.1; // 100ms
  const buffer = createBuffer(duration);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Oscillation entre deux fréquences
    const freq = t < duration / 2 ? 1000 : 750;
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10);
  }

  saveBufferToWav(buffer, "wakawaka.wav");
}

// Générer le son de mort
function generateDeath() {
  const duration = 1.5;
  const buffer = createBuffer(duration);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Fréquence descendante
    const freq = 1000 - t * 500;
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2);
  }

  saveBufferToWav(buffer, "death.wav");
}

// Générer le son de fantôme mangé
function generateGhostEat() {
  const duration = 0.5;
  const buffer = createBuffer(duration);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Fréquence montante
    const freq = 200 + t * 1000;
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 4);
  }

  saveBufferToWav(buffer, "ghost_eat.wav");
}

// Générer le son de super pac-gomme
function generatePowerPellet() {
  const duration = 0.2;
  const buffer = createBuffer(duration);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Son distinctif
    const freq = 800;
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5);
  }

  saveBufferToWav(buffer, "power_pellet.wav");
}

// Générer le son de début de partie
function generateGameStart() {
  const duration = 2;
  const buffer = createBuffer(duration);
  const data = buffer.getChannelData(0);

  const melody = [
    { freq: 440, dur: 0.2 },
    { freq: 554.37, dur: 0.2 },
    { freq: 659.25, dur: 0.2 },
    { freq: 880, dur: 1.4 },
  ];

  let time = 0;
  for (const note of melody) {
    for (let i = 0; i < note.dur * sampleRate; i++) {
      const t = time + i / sampleRate;
      data[Math.floor(t * sampleRate)] =
        Math.sin(2 * Math.PI * note.freq * t) * Math.exp(-t);
    }
    time += note.dur;
  }

  saveBufferToWav(buffer, "game_start.wav");
}

// Générer la sirène
function generateSiren() {
  const duration = 5;
  const buffer = createBuffer(duration);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    // Sirène oscillante
    const freq = 800 + 100 * Math.sin(2 * Math.PI * 0.5 * t);
    data[i] = Math.sin(2 * Math.PI * freq * t) * 0.5;
  }

  saveBufferToWav(buffer, "siren.wav");
}

// Générer tous les sons
function generateAllSounds() {
  console.log("Génération des sons...");
  generateWakaWaka();
  generateDeath();
  generateGhostEat();
  generatePowerPellet();
  generateGameStart();
  generateSiren();
  console.log("Sons générés avec succès !");
}

generateAllSounds();
