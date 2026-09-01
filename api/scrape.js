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

const PRICE_KEYS = /^(?:price|salePrice|regularPrice|currentPrice|listPrice|basePrice|finalPrice|offerPrice|discountedPrice|amount)$/i;

function extractScriptPrice(html) {
  // Collect all price-like values from every <script> block
  const candidates = [];
  for (const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)) {
    const t = m[1];
    if (!t.includes("price") && !t.includes("Price") && !t.includes("amount")) continue;
    for (const hit of t.matchAll(/"([^"]{4,40})"\s*:\s*"?([\d.]+)"?/g)) {
      if (PRICE_KEYS.test(hit[1])) {
        const v = parseFloat(hit[2]);
        if (v > 1 && v < 100000) candidates.push(v);
      }
    }
  }
  return mostCommon(candidates);
}

function mostCommon(arr) {
  if (!arr.length) return null;
  const counts = {};
  for (const v of arr) counts[v] = (counts[v] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? parseFloat(top[0]) : null;
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

  // Microdata itemprop=price
  if (!result.price) {
    const m = html.match(/itemprop=["']price["'][^>]+content=["']([\d.]+)["']/i)
      || html.match(/content=["']([\d.]+)["'][^>]+itemprop=["']price["']/i);
    if (m) result.price = parseFloat(m[1]) || null;
  }

  // __NEXT_DATA__ (Next.js) and general script-tag JSON price fields
  if (!result.price) {
    result.price = extractScriptPrice(html);
  }

  // Last resort: first dollar amount that looks like a product price
  if (!result.price) {
    const m = html.match(/\$\s*([\d,]+\.\d{2})\b/);
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ""));
      if (v > 0 && v < 100000) result.price = v;
    }
  }

  result.title = result.title.replace(/\s+/g, " ").trim().slice(0, 200);
  result.description = result.description.slice(0, 400);
  return result;
}
