import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('SPEECHIFY_API_KEY');
    const voiceId = Deno.env.get('SPEECHIFY_NADIA_VOICE_ID');

    // Try both hosts for /audio/speech
    const hosts = ['https://api.speechify.ai', 'https://api.sws.speechify.com'];
    const results = {};

    for (const host of hosts) {
      try {
        const resp = await fetch(`${host}/v1/audio/speech`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: 'Hello world.',
            voice_id: voiceId,
            audio_format: 'mp3',
            model: 'simba-english',
          }),
        });
        const text = await resp.text();
        results[host] = {
          status: resp.status,
          ok: resp.ok,
          bodyPreview: text.substring(0, 300),
          hasAudioData: text.includes('audio_data'),
        };
      } catch (e) {
        results[host] = { error: e.message };
      }
    }

    return Response.json({ keyPrefix: apiKey?.substring(0, 6), voiceId, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});