const googleTTS = require('google-tts-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const TEMPLATES = {
  mr: (stop) => `पुढील थांबा ${stop}. कृपया तयार राहा.`,
  gu: (stop) => `આગળનું સ્ટોપ ${stop}. કૃપા કરીને તૈયાર રહો.`,
  hi: (stop) => `अगला स्टॉप ${stop}. कृपया तैयार रहें.`,
  en: (stop) => `Next stop ${stop}. Please be ready.`,
};

async function downloadAudio(text, lang, fileName) {
  const filePath = path.join(AUDIO_DIR, fileName);
  try {
    // google-tts-api returns array for long text
    const results = await googleTTS.getAllAudioUrls(text, {
      lang: lang,
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.?!',
    });

    // Download each piece and concatenate
    const buffers = [];
    for (const r of results) {
      const res = await axios.get(r.url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      buffers.push(Buffer.from(res.data));
    }

    fs.writeFileSync(filePath, Buffer.concat(buffers));
    return true;
  } catch (err) {
    console.error(`TTS ${lang} error:`, err.message);
    return false;
  }
}

// PRIMARY + ENGLISH only
async function generateTwoLanguages(stopNames, primaryLang) {
  const results = {};
  const langMap = {
    'mr': 'stop_name_mr',
    'gu': 'stop_name_gu',
    'hi': 'stop_name_gu',
    'en': 'stop_name',
  };

  const primary = primaryLang === 'en' ? 'en' : primaryLang;
  const primaryKey = langMap[primary] || 'stop_name';
  const primaryName = stopNames[primaryKey] || stopNames.stop_name || '';

  if (primary !== 'en' && primaryName) {
    const text = TEMPLATES[primary](primaryName);
    const fileName = `ann_${Date.now()}_${primary}_${Math.random().toString(36).substr(2, 5)}.mp3`;
    const ok = await downloadAudio(text, primary, fileName);
    if (ok) {
      results[primary] = { url: `/audio/${fileName}`, text, language: primary, stopName: primaryName };
    }
  }

  // English always
  if (stopNames.stop_name) {
    const text = TEMPLATES.en(stopNames.stop_name);
    const fileName = `ann_${Date.now()}_en_${Math.random().toString(36).substr(2, 5)}.mp3`;
    const ok = await downloadAudio(text, 'en', fileName);
    if (ok) {
      results.en = { url: `/audio/${fileName}`, text, language: 'en', stopName: stopNames.stop_name };
    }
  }

  console.log(`🔊 Announcements generated for: ${Object.keys(results).join(', ')}`);
  return results;
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

module.exports = { generateTwoLanguages, haversine, calculateETA, TEMPLATES, cleanupOldAudio };
