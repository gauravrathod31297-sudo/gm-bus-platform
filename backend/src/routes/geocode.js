const express = require('express');
const router = express.Router();
const axios = require('axios');

// Search places using OpenStreetMap Nominatim (FREE, no API key)
router.get('/search', async (req, res) => {
  try {
    const { q, lat, lng } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    // Build URL with optional location bias
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=10&addressdetails=1&countrycodes=in`;
    if (lat && lng) {
      url += `&viewbox=${parseFloat(lng) - 0.5},${parseFloat(lat) + 0.5},${parseFloat(lng) + 0.5},${parseFloat(lat) - 0.5}&bounded=0`;
    }

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'GM-Bus-Tracking/1.0' },
      timeout: 10000,
    });

    const results = response.data.map((item) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      name: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      address: item.address,
    }));

    res.json({ success: true, results });
  } catch (err) {
    console.error('Geocode error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Reverse geocode — lat/lng → address
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat/lng required' });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'GM-Bus-Tracking/1.0' },
      timeout: 10000,
    });

    res.json({
      success: true,
      display_name: response.data.display_name,
      address: response.data.address,
      name: response.data.name || response.data.display_name?.split(',')[0],
    });
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    res.status(500).json({ error: 'Reverse geocode failed' });
  }
});

module.exports = router;
