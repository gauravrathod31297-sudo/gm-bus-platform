const translate = require('google-translate-api-x');

// Translate stop name to Marathi + Gujarati
async function translateStopName(text, sourceLang = 'en') {
  try {
    const results = {};
    
    // Translate to Marathi
    const mrResult = await translate(text, { from: sourceLang, to: 'mr' });
    results.mr = mrResult.text;
    
    // Translate to Gujarati
    const guResult = await translate(text, { from: sourceLang, to: 'gu' });
    results.gu = guResult.text;
    
    // English (as-is)
    results.en = text;
    
    console.log(`🌐 Translated "${text}" → MR: "${results.mr}", GU: "${results.gu}"`);
    return results;
  } catch (err) {
    console.error('Translation error:', err.message);
    // Fallback: same name in all languages
    return { en: text, mr: text, gu: text };
  }
}

module.exports = { translateStopName };
