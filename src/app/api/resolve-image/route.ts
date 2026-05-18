export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  let targetUrl = url;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; bot)',
        'Accept': 'text/html,image/*',
      },
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') ?? '';

    // Already a direct image
    if (contentType.startsWith('image/')) {
      return Response.json({ url: targetUrl });
    }

    // HTML page — extract image URL from meta tags
    if (contentType.includes('text/html')) {
      const html = await res.text();

      // Try og:image first (Tenor, Giphy, etc.)
      const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogMatch) return Response.json({ url: ogMatch[1] });

      // Twitter image fallback
      const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
      if (twMatch) return Response.json({ url: twMatch[1] });
    }

    return Response.json({ error: 'No image found at that URL' }, { status: 400 });
  } catch {
    return Response.json({ error: 'Failed to fetch URL' }, { status: 400 });
  }
}
