export default async function handler(req, res) {
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
      return res.status(500).json({ error: 'API key not found in environment' });
    }

    const mentorPrompts = {
      akshay: 'You are Akshay Pratap Singh. Ask one reflective question. Max 50 words.',
      deepak: 'You are Deepak Chopra. Suggest one next action. Max 50 words.',
      anmol: 'You are Anmol Singh. Separate what they control. Max 50 words.',
      neetu: 'You are Neetu Mann. Find the balanced approach. Max 50 words.'
    };

    const systemPrompt = mentorPrompts[mentorId] || mentorPrompts.akshay;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{
          text: message
        }]
      }],
      systemInstruction: {
        parts: [{
          text: systemPrompt
        }]
      }
    });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    const responseData = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(500).json({
        error: 'Gemini API failed',
        status: geminiRes.status,
        message: responseData?.error?.message || 'Unknown error'
      });
    }

    const mentorResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!mentorResponse) {
      return res.status(500).json({
        error: 'No response text from Gemini',
        data: responseData
      });
    }

    return res.status(200).json({
      response: mentorResponse
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: error?.message || 'Unknown error',
      type: error?.name || 'Error'
    });
  }
}
