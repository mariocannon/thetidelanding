// Subscribes an email to Beehiiv. Called directly by the signup form on the
// landing page (browser → this function → Beehiiv), so the Beehiiv API key
// never touches the client.
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
  const email = typeof payload?.email === 'string'
    ? payload.email.trim().toLowerCase()
    : '';
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

  console.log(`Subscribed ${email} to Beehiiv`);
  return json({ ok: true }, 200);
});
