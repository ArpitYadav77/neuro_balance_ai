const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function predictStress(payload) {
  try {
    const response = await axios.post(`${AI_URL}/predict-stress`, payload, {
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    console.error('[aiClient] Failed to reach AI service:', err.message);
    return null;
  }
}

module.exports = { predictStress };
