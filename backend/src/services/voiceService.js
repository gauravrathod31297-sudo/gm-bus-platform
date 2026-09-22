const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const TEMPLATES = {
  mr: (stop) => `पुढील थांबा ${stop}. कृपया तयार राहा.`,
  gu: (stop) => `આગળનું સ્ટોપ ${stop}. કૃપા કરીને તૈયાર રહો.`,
  hi: (stop) => `अगला स्टॉप ${stop}. कृपया तैयार रहें.`,
  en: (stop) => `Next stop ${stop}. Please be ready.`,
};

// Generate audio for SPECIFIC languages (based on client settings)
async function generateSelectedLanguages(stopNames, languages) {
  const results = {};
  const langList = (languages || 'mr,gu,en').split(',').map(l => l.trim());

  for (const code of langList) {
    const stopName = stopNames[code] || stopNames.en || stopNames[Object.keys(stopNames)[0]];
    if (!stopName) continue;

    try {
      const text = TEMPLATES[code](stopName);
      const fileName = `ann_${Date.now()}_${code}_${Math.random().toString(36).substr(2, 5)}.mp3`;
      const filePath = path.join(AUDIO_DIR, fileName);

      await new Promise((resolve, reject) => {
        const gtts = new gTTS(text, code);
        gtts.save(filePath, (err) => err ? reject(err) : resolve());
      });

      results[code] = {
        url: `/audio/${fileName}`,
        text,
        language: code,
        stopName,
      };
    } catch (err) {
      console.error(`TTS ${code} error:`, err.message);
    }
  }

  return results;
}

// Generate ALL languages (legacy)
async function generateAllLanguages(stopNameMr, stopNameGu, stopNameEn) {
  return generateSelectedLanguages(
    { mr: stopNameMr, gu: stopNameGu, en: stopNameEn },
    'mr,gu,en'
  );
}

async function generateAnnouncement(stopName, lang = 'mr') {
  const template = TEMPLATES[lang] || TEMPLATES.en;
  const text = template(stopName);
  const fileName = `ann_${Date.now()}_${lang}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);

  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, lang);
    gtts.save(filePath, (err) => {
      if (err) reject(err);
      else resolve({ url: `/audio/${fileName}`, text, language: lang, stopName });
    });
  });
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateETA(busLat, busLng, stopLat, stopLng, speedKmh) {
  const distance = haversine(busLat, busLng, stopLat, stopLng);
  const speed = speedKmh > 0 ? speedKmh : 20;
  return (distance / 1000) / speed * 3600;
}

function cleanupOldAudio() {
  try {
    const files = fs.readdirSync(AUDIO_DIR);
    const now = Date.now();
    files.forEach((f) => {
      const fp = path.join(AUDIO_DIR, f);
      if (now - fs.statSync(fp).mtimeMs > 24 * 60 * 60 * 1000) fs.unlinkSync(fp);
    });
  } catch (err) { console.error('Cleanup:', err.message); }
}

setInterval(cleanupOldAudio, 6 * 60 * 60 * 1000);

module.exports = {
  generateAnnouncement,
  generateAllLanguages,
  generateSelectedLanguages,
  haversine,
  calculateETA,
  TEMPLATES,
  cleanupOldAudio,
};
