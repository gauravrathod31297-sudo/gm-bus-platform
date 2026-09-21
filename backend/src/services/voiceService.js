const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Announcement templates for different languages
const ANNOUNCEMENT_TEMPLATES = {
  mr: (stop) => `पुढील थांबा ${stop}. कृपया तयार राहा.`,
  gu: (stop) => `આગળનું સ્ટોપ ${stop}. કૃપા કરીને તૈયાર રહો.`,
  hi: (stop) => `अगला स्टॉप ${stop}. कृपया तैयार रहें.`,
  en: (stop) => `Next stop ${stop}. Please be ready.`,
};

// Generate announcement audio
async function generateAnnouncement(stopName, lang = 'mr') {
  const template = ANNOUNCEMENT_TEMPLATES[lang] || ANNOUNCEMENT_TEMPLATES.en;
  const text = template(stopName);
  const fileName = `ann_${Date.now()}_${lang}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);

  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, lang);
    gtts.save(filePath, (err) => {
      if (err) {
        console.error('TTS error:', err);
        reject(err);
      } else {
        console.log(`🔊 Generated: ${fileName}`);
        resolve({
          url: `/audio/${fileName}`,
          text,
          language: lang,
          stopName,
        });
      }
    });
  });
}

// Haversine distance in meters
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Calculate ETA in seconds
function calculateETA(busLat, busLng, stopLat, stopLng, speedKmh) {
  const distanceMeters = haversine(busLat, busLng, stopLat, stopLng);
  const speed = speedKmh > 0 ? speedKmh : 20;
  return (distanceMeters / 1000) / speed * 3600;
}

// Cleanup old audio files (older than 1 day)
function cleanupOldAudio() {
  try {
    const files = fs.readdirSync(AUDIO_DIR);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(AUDIO_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > dayMs) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

// Run cleanup every 6 hours
setInterval(cleanupOldAudio, 6 * 60 * 60 * 1000);

module.exports = {
  generateAnnouncement,
  haversine,
  calculateETA,
  ANNOUNCEMENT_TEMPLATES,
  cleanupOldAudio,
};
