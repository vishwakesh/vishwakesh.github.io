import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};
const attempts = new Map<string, number[]>();

function clean(value: unknown, max: number) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 5) return new Response(JSON.stringify({ error: 'Please wait before submitting again.' }), { status: 429, headers });
  recent.push(now);
  attempts.set(ip, recent);

  try {
    const body = await request.json();
    const display_name = clean(body.display_name, 60);
    const message = clean(body.message, 500);
    if (display_name.length < 2 || message.length < 3) return new Response(JSON.stringify({ error: 'Please provide a valid name and message.' }), { status: 400, headers });
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const since = new Date(now - 60_000).toISOString();
    const { data: duplicate } = await supabase.from('guestbook').select('id').eq('display_name', display_name).eq('message', message).gte('created_at', since).limit(1);
    if (duplicate?.length) return new Response(JSON.stringify({ error: 'That message was already submitted.' }), { status: 409, headers });
    const { error } = await supabase.from('guestbook').insert({ display_name, message, is_approved: false });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers });
  } catch {
    return new Response(JSON.stringify({ error: 'Unable to submit your message right now.' }), { status: 500, headers });
  }
});
