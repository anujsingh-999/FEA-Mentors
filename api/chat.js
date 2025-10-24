module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, mentorId } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'API key not set' });
      return;
    }

    const prompts = {
      akshay: 'You are Akshay. Ask one reflective question. Max 50 words.',
      deepak: 'You are Deepak. Suggest one action. Max 50 words.',
      anmol: 'You are Anmol. Separate control from non-control. Max 50 words.',
      neetu: 'You are Neetu. Find balance. Max 50 words.'
    };

    const prompt = prompts[mentorId] || prompts.akshay;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: prompt }] }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: 'Gemini failed', data });
      return;
    }

    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      res.status(500).json({ error: 'No response' });
      return;
    }

    res.status(200).json({ response: result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
