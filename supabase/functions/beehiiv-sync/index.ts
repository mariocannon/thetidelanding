// Subscribes an email to Beehiiv, so the Beehiiv API key never touches the
// client. Called by the subscribers_sync_beehiiv DB trigger (used by the
// non-home-page signup forms), POSTing { "record": { "email": "..." } } via
// pg_net. A bare { "email": "..." } payload is still accepted for backward
// compatibility — the home page used to call this directly, but now uses
// beehiiv's embedded subscribe form instead and no longer touches Supabase.
//
// Required secrets (Dashboard → Edge Functions → Secrets):
//   BEEHIIV_API_KEY        — Beehiiv Settings → Integrations → API keys
//   BEEHIIV_PUBLICATION_ID — starts with "pub_", same Integrations page

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req: Request) => {
  // CORS preflight.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('BEEHIIV_API_KEY');
  const publicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID');
  if (!apiKey || !publicationId) {
    console.error('BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID secrets are not set');
    return json({ error: 'Not configured' }, 500);
  }

  const payload = await req.json().catch(() => null);
  // Direct browser call sends { email }; the DB trigger sends { record: { email } }.
  const raw = payload?.email ?? payload?.record?.email;
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'A valid email is required' }, 400);
  }

  const response = await fetch(
    `https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: 'the-tide-landing',
      }),
    },
  );

  const body = await response.text();
  if (!response.ok) {
    console.error(`Beehiiv responded ${response.status}: ${body}`);
    return json({ error: 'Subscription failed' }, 502);
  }

  // Log the full Beehiiv response so we can see the subscription status
  // (e.g. "pending" means double opt-in is on and a confirmation email was sent).
  console.log(`Beehiiv ${response.status} for ${email}: ${body}`);
  return json({ ok: true }, 200);
});
