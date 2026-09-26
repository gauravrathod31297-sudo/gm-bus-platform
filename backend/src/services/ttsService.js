const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const AUDIO_DIR = path.join(__dirname, '../../public/audio');

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

const LANG_MAP = { mr: 'mr', gu: 'gu', hi: 'hi', en: 'en' };

async function generateTTS(text, langCode) {
  return new Promise((resolve, reject) => {
    const gttsLang = LANG_MAP[langCode] || 'en';
    const hash = crypto.createHash('md5').update(`${text}|${gttsLang}`).digest('hex').slice(0, 12);
    const filename = `tts_${gttsLang}_${hash}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(filepath)) {
      return resolve({ url: `/audio/${filename}`, cached: true });
    }

    const py = `from gtts import gTTS\n` +
      `text = ${JSON.stringify(text)}\n` +
      `gTTS(text=text, lang='${gttsLang}', slow=False).save(${JSON.stringify(filepath)})\n`;
    const tmpScript = `/tmp/gtts_${Date.now()}.py`;
    fs.writeFileSync(tmpScript, py);

    exec(`python3 ${tmpScript}`, { timeout: 20000 }, (error) => {
      try { fs.unlinkSync(tmpScript); } catch (_) {}
      if (error) {
        return reject(new Error(`gTTS failed: ${error.message}`));
      }
      if (!fs.existsSync(filepath)) {
        return reject(new Error('gTTS did not produce file'));
      }
      resolve({ url: `/audio/${filename}`, cached: false });
    });
  });
}

module.exports = { generateTTS };
