export default async function handler(req, res) {
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
      res.status(500).json({ error: 'API key missing' });
      return;
    }

    const mentors = {
      akshay: 'You are a Socratic mentor. Ask reflective questions. Keep under 50 words.',
      deepak: 'You are an action coach. Focus on next steps. Keep under 50 words.',
      anmol: 'You are a Stoic guide. Separate control from non-control. Keep under 50 words.',
      neetu: 'You are a virtue mentor. Guide toward balance. Keep under 50 words.'
    };

    const instruction = mentors[mentorId] || mentors.akshay;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const body = {
      contents: [{
        parts: [{ text: message }]
      }],
      systemInstruction: {
        parts: [{ text: instruction }]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(500).json({ error: 'Gemini error', details: data });
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      res.status(500).json({ error: 'No response' });
      return;
    }

    res.status(200).json({ response: text });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
