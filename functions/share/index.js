const SUPABASE_URL = "https://jeaopfgdhwnuddgxzqoj.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplYW9wZmdkaHdudWRkZ3h6cW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODgxNzMsImV4cCI6MjA5NDA2NDE3M30.lOBlKICCCGmG8t3ffKlkjilzdUuBBXo93GnRvWs2aN4";

const CRAWLER_AGENTS = [
  "facebookexternalhit", "twitterbot", "linkedinbot", "whatsapp",
  "slackbot", "telegrambot", "discordbot", "googlebot", "bingbot",
  "applebot", "imessage", "icloud",
];

function isCrawler(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => lower.includes(bot));
}

function formatMonth(iso) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function dateRange(createdAt, wrappedAt) {
  const start = formatMonth(createdAt);
  if (!wrappedAt) return start;
  const end = formatMonth(wrappedAt);
  if (start === end) return start;
  const startMonth = new Date(createdAt).toLocaleDateString("en-US", { month: "long" });
  return `${startMonth} – ${end}`;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");
  const ua = context.request.headers.get("user-agent") ?? "";

  // Non-crawler requests: serve the static file as-is
  if (!isCrawler(ua) || !token) {
    return context.next();
  }

  // Crawler with a token: fetch trip data and inject OG tags
  let ogTitle = "Trip Story — TravelThread";
  let ogDescription = "See the shared memories from this trip.";
  let ogImage = "";

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/collage-share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ANON_KEY}`,
        "apikey": ANON_KEY,
      },
      body: JSON.stringify({ share_token: token }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.group_name) {
        const range = dateRange(data.created_at, data.wrapped_at);
        ogTitle = `${data.group_name} — TravelThread`;
        ogDescription = `${data.photo_count} photos · ${data.member_count} travellers · ${range}`;
        ogImage = data.image_url ?? "";
      }
    }
  } catch { /* serve generic meta on error */ }

  // Fetch the static file and inject meta tags
  const staticRes = await context.next();
  let html = await staticRes.text();

  const metaTags = [
    `<meta property="og:title" content="${escapeAttr(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(ogDescription)}" />`,
    `<meta property="og:image" content="${escapeAttr(ogImage)}" />`,
    `<meta property="og:image:width" content="1204" />`,
    `<meta property="og:image:height" content="904" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(ogDescription)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />`,
  ].join("\n  ");

  html = html.replace("</head>", `  ${metaTags}\n</head>`);

  return new Response(html, {
    status: staticRes.status,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
