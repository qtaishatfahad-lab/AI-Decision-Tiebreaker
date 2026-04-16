export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mode, query } = req.body;

  if (!mode || !query) {
    return res.status(400).json({ error: 'mode and query are required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server' });
  }

  const systemPrompt = `You are a decision logic engine. You MUST respond with ONLY valid JSON. No talk.
  Mode 'pros-cons': {"pros": ["str"], "cons": ["str"], "verdict": "str", "confidence": 90}
  Mode 'table': {"tableData": [{"factor": "str", "optA": "str", "optB": "str"}], "verdict": "str", "confidence": 90}
  Mode 'swot': {"swot": {"strengths": [], "weaknesses": [], "opportunities": [], "threats": []}, "verdict": "str", "confidence": 90}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Mode: ${mode}. Dilemma: ${query}` },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({ error: data.error.message });
    }

    const result = JSON.parse(data.choices[0].message.content);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
