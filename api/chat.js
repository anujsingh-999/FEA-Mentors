export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, mentorId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const mentorInstructions = {
      akshay: 'You are Akshay Pratap Singh. Help users discover their own truth through reflective questions. Keep responses under 50 words. End with one open-ended question.',
      deepak: 'You are Deepak Chopra. Focus on immediate next steps. Keep responses under 50 words. End with an action-oriented question.',
      anmol: 'You are Anmol Singh. Help separate controllable from uncontrollable factors. Keep responses under 50 words. End with a reflective question.',
      neetu: 'You are Neetu Mann. Guide toward balanced, virtuous decisions. Keep responses under 50 words. End with a question about balance.'
    };

    const instruction = mentorInstructions[mentorId] || mentorInstructions.akshay;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: { parts: [{ text: instruction }] }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error: 'Gemini API error', details: error });
    }

    const data = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!result) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    res.status(200).json({ response: result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}