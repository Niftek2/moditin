import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, rate } = await req.json();
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Missing text' }, { status: 400 });
    }

    const apiKey = Deno.env.get('SPEECHIFY_API_KEY');
    const voiceId = Deno.env.get('SPEECHIFY_NADIA_VOICE_ID');
    if (!apiKey || !voiceId) {
      console.error('Speechify secrets not configured');
      return Response.json({ error: 'Speechify not configured' }, { status: 500 });
    }

    // Clamp rate 0.5–2.0; Speechify uses SSML <prosody rate="x%"> where 100% = normal
    const numRate = Math.max(0.5, Math.min(2.0, Number(rate) || 1.0));
    const ratePercent = Math.round(numRate * 100);
    const safeText = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ssml = `<speak><prosody rate="${ratePercent}%">${safeText}</prosody></speak>`;

    // Speechify API
    const resp = await fetch('https://api.speechify.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: ssml,
        voice_id: voiceId,
        audio_format: 'mp3',
        model: 'simba-english',
      }),
    });

    console.log('Speechify key length:', apiKey.length, 'prefix:', apiKey.substring(0, 4));
    console.log('Voice ID:', voiceId);

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('Speechify API error:', resp.status, errBody);
      return Response.json({ error: 'Speechify request failed', detail: errBody }, { status: 502 });
    }

    const data = await resp.json();
    const audioBase64 = data.audio_data;
    if (!audioBase64) {
      console.error('Speechify response missing audio_data:', data);
      return Response.json({ error: 'No audio returned' }, { status: 502 });
    }

    return Response.json({ audioUrl: `data:audio/mp3;base64,${audioBase64}` });
  } catch (error) {
    console.error('speechifyTts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});