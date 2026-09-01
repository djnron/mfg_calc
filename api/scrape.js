module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "url required" });

  let parsed;
  try { parsed = new URL(url); }
  catch (_) { return res.status(400).json({ error: "invalid url" }); }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "http/https only" });
  }

  let html;
  try {
    const r = await fetch(parsed.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return res.status(502).json({ error: `upstream ${r.status}` });
    html = await r.text();
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  res.json(parseProduct(html, parsed.href));
};

function og(html, prop) {
  const m = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, "i"));
  return m ? decode(m[1]) : null;
}

function decode(s) {
  return s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&#(\d+);/g,(_,c)=>String.fromCharCode(c));
}

function parseProduct(html, url) {
  const result = { url, title: "", price: null, description: "" };

  // JSON-LD Product schema
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = [data, ...(data["@graph"] || [])].flat();
      const product = nodes.find(n => n && n["@type"] === "Product");
      if (product) {
        result.title = result.title || product.name || "";
        result.description = result.description || product.description || "";
        const offer = [product.offers].flat()[0];
        if (offer && !result.price) result.price = parseFloat(offer.price) || null;
      }
    } catch (_) {}
  }

  // OpenGraph fallbacks
  result.title = result.title || og(html, "title") || "";
  result.description = result.description || og(html, "description") || "";
  if (!result.price) {
    const p = og(html, "price:amount");
    if (p) result.price = parseFloat(p) || null;
  }

  // <title> tag
  if (!result.title) {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (m) result.title = decode(m[1]).trim();
  }

  // meta description
  if (!result.description) {
    const m = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (m) result.description = decode(m[1]);
  }

  // Price fallback: first plausible dollar amount in the HTML
  if (!result.price) {
    for (const pattern of [
      /"price":\s*"?([\d.]+)"?/,
      /itemprop=["']price["'][^>]+content=["']([\d.]+)["']/i,
      /\$([\d,]+\.\d{2})\b/,
    ]) {
      const m = html.match(pattern);
      if (m) {
        const v = parseFloat(m[1].replace(/,/g, ""));
        if (v > 0 && v < 100000) { result.price = v; break; }
      }
    }
  }

  result.title = result.title.replace(/\s+/g, " ").trim().slice(0, 200);
  result.description = result.description.slice(0, 400);
  return result;
}
