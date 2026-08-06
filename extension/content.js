function firstText(selectors) {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    const text = el?.content || el?.innerText || el?.textContent;
    if (text && text.trim()) return text.trim();
  }
  return "";
}
function numberFromPrice(text) {
  if (!text) return null;
  const clean = text.replace(/,/g, "");
  const match = clean.match(/(?:\$|USD\s*)?(\d+(?:\.\d{1,2})?)/i);
  return match ? Number(match[1]) : null;
}
function jsonLdProducts() {
  const output = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
    try {
      const parsed = JSON.parse(script.textContent);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const graph = item?.["@graph"] ? item["@graph"] : [item];
        for (const node of graph) if (node?.["@type"] === "Product" || node?.["@type"]?.includes?.("Product")) output.push(node);
      }
    } catch (_) {}
  });
  return output;
}
function extractProduct() {
  const ld = jsonLdProducts()[0] || {};
  const offer = Array.isArray(ld.offers) ? ld.offers[0] : (ld.offers || {});
  const title = ld.name || firstText([
    "#productTitle","h1[data-testid='product-title']","h1.product-title","h1"
  ]) || document.title;
  const description = ld.description || firstText([
    "#feature-bullets",".product-description","[data-testid='product-description']",
    "meta[name='description']"
  ]);
  const priceText = offer.price || firstText([
    "#corePrice_feature_div .a-offscreen",".priceToPay .a-offscreen",
    "[itemprop='price']",".price",".product-price","meta[property='product:price:amount']"
  ]);
  const image = typeof ld.image === "string" ? ld.image : (Array.isArray(ld.image) ? ld.image[0] : "") ||
    document.querySelector("meta[property='og:image']")?.content || "";
  const bodyText = document.body?.innerText?.slice(0, 30000) || "";
  const weightMatch = bodyText.match(/(?:item\s+weight|weight)\s*[:\-]?\s*([\d.]+\s*(?:lb|lbs|oz|kg|g))/i);
  const dimensionsMatch = bodyText.match(/(?:product\s+dimensions|dimensions)\s*[:\-]?\s*([\d.]+\s*[x×]\s*[\d.]+\s*[x×]\s*[\d.]+\s*(?:inches|inch|in|cm|mm)?)/i);
  return {
    url: location.href,
    domain: location.hostname,
    title,
    description: String(description || "").slice(0, 1500),
    retail_price: numberFromPrice(String(priceText || offer.lowPrice || "")),
    currency: offer.priceCurrency || "USD",
    image,
    weight: weightMatch?.[1] || "",
    dimensions: dimensionsMatch?.[1] || "",
    captured_at: new Date().toISOString()
  };
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "EXTRACT_PRODUCT") {
    sendResponse({ ok: true, product: extractProduct() });
  }
  return true;
});