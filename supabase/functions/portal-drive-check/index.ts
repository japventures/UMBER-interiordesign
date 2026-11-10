function verifiedMfa(token,user){
 // Call only after Supabase auth.getUser(token) validates this same JWT.
 try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const claims=JSON.parse(atob(part));return claims.sub===user.id&&claims.aal==='aal2';}catch{return false;}
}
import { createClient } from 'npm:@supabase/supabase-js@2.102.1';

Deno.serve(async (req) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': 'https://japventures.github.io',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
  const reply = (status, data) =>
    new Response(JSON.stringify(data), { status, headers });

  if (req.headers.get('origin') && req.headers.get('origin') !== 'https://japventures.github.io') return reply(403, { error: 'Origin not allowed' });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'Use POST' });
  try {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer /i, '');
    if (!token) return reply(401, { error: 'Inicia sesión en el portal' });
    const client = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return reply(401, { error: 'Sesión no válida' });
    if (!verifiedMfa(token,user)) return reply(403,{error:'MFA_REQUIRED'});
    const { data: staff, error: staffError } = await client
      .from('portal_staff').select('user_id').eq('user_id', user.id).maybeSingle();
    if (staffError || !staff) return reply(403, { error: 'Acceso exclusivo del equipo UMBER' });

    let config;
    try {
      config = JSON.parse(Deno.env.get('GOOGLE_DRIVE_OAUTH_CLIENT') || '{}');
    } catch {
      return reply(200, { secret_present: true, valid_json: false, drive_connected: false });
    }
    const web = config.web || {};
    const callback = 'https://nsugfmibvlrifcrvmsex.supabase.co/functions/v1/portal-drive-oauth/callback';
    return reply(200, {
      secret_present: !!Deno.env.get('GOOGLE_DRIVE_OAUTH_CLIENT'),
      valid_json: true,
      web_client: typeof web.client_id === 'string' && web.client_id.endsWith('.apps.googleusercontent.com'),
      client_secret_present: typeof web.client_secret === 'string' && web.client_secret.length > 0,
      correct_project: web.project_id === 'umber-portal-20261109',
      callback_matches: Array.isArray(web.redirect_uris) && web.redirect_uris.includes(callback),
      drive_connected: false,
    });
  } catch {
    return reply(503, { error: 'No se pudo completar la comprobación' });
  }
});
