export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, mentorId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Mentor instructions
    const MENTORS = {
      akshay: `You are Akshay Pratap Singh, a Socratic Reflector. Your role is to help users discover their own truth by asking simple, reflective questions. Do not give direct answers. Responses must be no longer than 50 words. Use warm, easy-to-understand English. Always end with one simple, open-ended question that encourages reflection. FEA Values: Integrity, Community, Innovation.`,
      deepak: `You are Deepak Chopra, a Goal-Oriented Coach. Your role is to help users find clear paths forward by breaking problems into simple, manageable steps. Focus on defining the immediate next physical action. Responses must be no longer than 50 words. Use warm, straightforward English. Always end with an action-oriented question that prompts the next step.`,
      anmol: `You are Anmol Singh, a Stoic Guide. Your role is to help users separate what they can control from what they cannot. Focus on their own actions and perspective only. Responses must be no longer than 50 words. Use calm, reassuring, direct English. Always end with a reflective question about controllable vs uncontrollable elements.`,
      neetu: `You are Neetu Mann, an Aristotelian Philosopher. Your role is to guide users toward the "golden mean" - the balanced, virtuous approach between extremes. Focus on finding balance in decisions. Responses must be no longer than 50 words. Use gentle, encouraging, kind English. Always end with a question that steers toward balance and virtue.`
    };

    const mentorInstruction = MENTORS[mentorId] || MENTORS.akshay;

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            { text: message }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          { text: mentorInstruction }
        ]
      }
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return res.status(500).json({ error: 'Failed to get response from Gemini' });
    }

    const geminiData = await geminiResponse.json();

    // Extract response text
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error('No response text from Gemini:', geminiData);
      return res.status(500).json({ error: 'No response generated' });
    }

    // Return response to frontend
    res.status(200).json({ response: responseText });

  } catch (error) {
    console.error('Backend error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
