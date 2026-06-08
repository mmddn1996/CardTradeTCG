/**
 * Card-art proxy. Some card-image hosts (notably the official One Piece site)
 * hotlink-protect via Referer, so the browser can't load them directly. We
 * fetch server-side (no Referer) and stream the bytes back, with a host
 * allowlist to prevent the route being used as an open proxy (SSRF).
 */

const ALLOWED_SUFFIXES = [
  "images.pokemontcg.io",
  "onepiece-cardgame.com",
  "apitcg.com",
  "justtcg.com",
];

function isAllowed(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    ALLOWED_SUFFIXES.some(
      (s) => url.hostname === s || url.hostname.endsWith(`.${s}`) || url.hostname.endsWith(s),
    )
  );
}

export async function GET(request: Request): Promise<Response> {
  const src = new URL(request.url).searchParams.get("src");
  if (!src) return new Response("missing src", { status: 400 });

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return new Response("bad src", { status: 400 });
  }
  if (!isAllowed(target)) return new Response("host not allowed", { status: 403 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const upstream = await fetch(target, {
      signal: controller.signal,
      headers: { Accept: "image/*" }, // deliberately no Referer
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("upstream error", { status: 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("fetch failed", { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
