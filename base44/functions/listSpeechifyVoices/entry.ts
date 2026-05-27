import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('SPEECHIFY_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'No API key' }, { status: 500 });
    }

    const resp = await fetch('https://api.sws.speechify.com/v1/voices', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    const body = await resp.text();
    if (!resp.ok) {
      console.error('Voices list error:', resp.status, body);
      return Response.json({ error: 'Failed', status: resp.status, body }, { status: 502 });
    }

    const data = JSON.parse(body);
    // Filter to show just essentials so we can find Nadia
    const list = Array.isArray(data) ? data : (data.voices || data.data || []);
    const simplified = list.map((v) => ({
      id: v.id || v.voice_id,
      name: v.display_name || v.name,
      type: v.type || v.voice_type,
      gender: v.gender,
    }));

    // Highlight any matches for "nadia"
    const nadiaMatches = simplified.filter((v) =>
      (v.name || '').toLowerCase().includes('nadia') ||
      (v.id || '').toLowerCase().includes('nadia')
    );

    return Response.json({
      total: simplified.length,
      nadiaMatches,
      allVoices: simplified,
    });
  } catch (error) {
    console.error('listSpeechifyVoices error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});