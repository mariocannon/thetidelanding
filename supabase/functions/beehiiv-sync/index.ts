// Pushes a new subscriber to Beehiiv. Called by the database trigger
// on insert into public.subscribers (see migration sync_to_beehiiv).
//
// Required secrets (Dashboard → Edge Functions → Secrets):
//   BEEHIIV_API_KEY        — Beehiiv Settings → Integrations → API keys
//   BEEHIIV_PUBLICATION_ID — starts with "pub_", same Integrations page

Deno.serve(async (req: Request) => {
  const apiKey = Deno.env.get('BEEHIIV_API_KEY');
  const publicationId = Deno.env.get('BEEHIIV_PUBLICATION_ID');
  if (!apiKey || !publicationId) {
    console.error('BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID secrets are not set');
    return new Response('Beehiiv secrets not configured', { status: 500 });
  }

  const payload = await req.json().catch(() => null);
  const email = payload?.record?.email;
  if (typeof email !== 'string' || email.length === 0) {
    return new Response('Missing record.email', { status: 400 });
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
    return new Response(body, { status: 502 });
  }

  console.log(`Synced ${email} to Beehiiv`);
  return new Response('ok', { status: 200 });
});
