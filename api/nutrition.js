export default async function handler(req, res) {
  // CORS headers — allow your Vercel app to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { food } = req.body;
  if (!food) {
    return res.status(400).json({ error: 'No food provided' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Give me the nutrition info for: "${food}"
          
Return ONLY a JSON object, no markdown, no explanation:
{"name":"food name","cal":number,"p":number,"c":number,"f":number,"serving":"description of serving size used"}

where:
- cal = calories (kcal)
- p = protein (grams)
- c = carbs (grams)  
- f = fat (grams)
- serving = what quantity this represents (e.g. "1 slice (100g)", "1 bowl (200g)")

Be accurate. Use standard serving sizes if not specified.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Could not calculate nutrition' });
  }
}
