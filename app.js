let benchmarks = [];
let productCatalog = [];
let lastEstimate = null;
let catalogMatch = null;
const $ = id => document.getElementById(id);
const n = id => Number($(id).value || 0);
const money = v => `$${Number(v).toFixed(2)}`;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
}
function normalizeTitle(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function normalizeUrl(value) {
  try {
    const u = new URL(value);
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch (_) {
    return String(value || "").split(/[?#]/)[0].replace(/\/$/, "");
  }
}

async function loadData() {
  const [br, pr] = await Promise.all([
    fetch("extension/benchmarks.json"),
    fetch("extension/product_estimates.json")
  ]);
  benchmarks = await br.json();
  productCatalog = await pr.json();

  const categories = [...new Set(benchmarks.map(x => x.category))].sort();
  $("category").innerHTML = categories.map(x => `<option>${escapeHtml(x)}</option>`).join("");
  rebuildArchetypes();

  const saved = JSON.parse(localStorage.getItem("lastEstimate") || "null");
  if (saved) {
    $("title").value = saved.product_title || "";
    $("pageUrl").value = saved.page_url || "";
    $("retailPrice").value = saved.retail_price_usd || "";
    $("quantity").value = saved.quantity || 1000;
  }
}

function rebuildArchetypes() {
  const rows = benchmarks.filter(x => x.category === $("category").value);
  $("archetype").innerHTML = rows.map(x =>
    `<option value="${escapeHtml(x.product_archetype)}">${escapeHtml(x.product_archetype)}</option>`
  ).join("");
}

function chooseBenchmark(text) {
  text = (text || "").toLowerCase();
  let best = benchmarks[0], score = -1;
  for (const row of benchmarks) {
    const source = `${row.category} ${row.product_archetype} ${row.construction_summary} ${row.keywords || ""}`.toLowerCase();
    const words = source.split(/\W+/).filter(w => w.length > 3);
    const s = words.reduce((sum, w) => sum + (text.includes(w) ? 1 : 0), 0);
    if (s > score) { best = row; score = s; }
  }
  $("category").value = best.category;
  rebuildArchetypes();
  $("archetype").value = best.product_archetype;
}

function selectedRow() {
  return benchmarks.find(x => x.category === $("category").value && x.product_archetype === $("archetype").value);
}

function volumeFactor(quantity, referenceQty) {
  const q = Math.max(1, quantity);
  const ref = Math.max(1, referenceQty);
  return Math.min(1.9, Math.max(0.68, Math.pow(ref / q, 0.14)));
}

function findCatalogMatch(title, url) {
  const pageUrl = normalizeUrl(url);
  if (pageUrl) {
    const exact = productCatalog.find(x => x.product_url && normalizeUrl(x.product_url) === pageUrl);
    if (exact) return exact;
  }
  const t = normalizeTitle(title);
  if (!t || t.length < 8) return null;
  return productCatalog.find(x => normalizeTitle(x.title) === t) || null;
}

function applyCatalogMatch(match) {
  catalogMatch = match;
  $("category").value = match.manufacturing_category;
  rebuildArchetypes();
  $("archetype").value = match.product_archetype;
  $("quantity").value = match.quantity_assumption || 1000;
  $("confidenceOverride").value = match.confidence || "";
  $("dutyRate").value = match.duty_assumption_percent ?? 5;
  $("marketplaceRate").value = match.marketplace_fee_rate_percent ?? 15;
  $("fulfillment").value = match.fulfillment_assumption_usd ?? 4.25;
  $("returnsRate").value = match.returns_allowance_rate_percent ?? 5;

  const row = selectedRow();
  if (!row) return;
  const vf = volumeFactor(Number(match.quantity_assumption || 1000), Number(row.reference_quantity));
  const benchmarkBase = Number(row.factory_cost_base_usd) * vf;
  $("factoryMultiplier").value = benchmarkBase > 0 ? (Number(match.factory_cost_base_usd) / benchmarkBase).toFixed(4) : 1;
  $("packagingMultiplier").value = Number(row.packaging_base_usd) > 0
    ? (Number(match.packaging_base_usd) / Number(row.packaging_base_usd)).toFixed(4) : 1;
  $("freightMultiplier").value = Number(row.freight_base_usd) > 0
    ? (Number(match.freight_base_usd) / Number(row.freight_base_usd)).toFixed(4) : 1;

  const badge = $("catalog-badge");
  badge.textContent = `Matched to ${match.platform || "reference"} catalog`;
  badge.classList.remove("hidden");
}

function calculate() {
  const row = selectedRow();
  if (!row) return;

  const quantity = Math.max(1, n("quantity"));
  const vf = volumeFactor(quantity, Number(row.reference_quantity));
  const fm = n("factoryMultiplier") || 1;
  const pm = n("packagingMultiplier") || 1;
  const sm = n("freightMultiplier") || 1;

  const factory = ["low","base","high"].map(k => Number(row[`factory_cost_${k}_usd`]) * vf * fm);
  const packaging = ["low","base","high"].map(k => Number(row[`packaging_${k}_usd`]) * pm);
  const freight = ["low","base","high"].map(k => Number(row[`freight_${k}_usd`]) * sm);
  const dutyRate = n("dutyRate") / 100;
  const landed = factory.map((v, i) => (v + packaging[i] + freight[i]) * (1 + dutyRate));
  const retail = n("retailPrice");
  const marketplace = retail * n("marketplaceRate") / 100;
  const returns = retail * n("returnsRate") / 100;
  const selling = landed.map(v => v + marketplace + n("fulfillment") + returns + n("otherCost"));
  const profit = selling.map(v => retail - v);
  const margin = profit.map(v => retail ? v / retail * 100 : 0);
  const conf = $("confidenceOverride").value || row.confidence;

  $("factoryResult").textContent = `${money(factory[0])} – ${money(factory[2])} (base ${money(factory[1])})`;
  $("landedResult").textContent = `${money(landed[0])} – ${money(landed[2])} (base ${money(landed[1])})`;
  $("sellingCostResult").textContent = money(selling[1]);
  $("profitResult").textContent = money(profit[1]);
  $("marginResult").textContent = `${margin[1].toFixed(1)}%`;
  $("confidence").textContent = conf;

  const isMatched = catalogMatch && catalogMatch.product_archetype === row.product_archetype;
  $("notes").textContent =
    (isMatched ? `Matched to the ${catalogMatch.platform} reference catalog. ` : "") +
    `${row.construction_summary}. ${row.notes} Quantity adjustment: ${vf.toFixed(2)}× versus reference quantity of ${row.reference_quantity}.`;

  lastEstimate = {
    captured_at: new Date().toISOString(),
    product_title: $("title").value,
    page_url: $("pageUrl").value,
    catalog_source: catalogMatch?.platform || "",
    retail_price_usd: retail,
    category: row.category,
    product_archetype: row.product_archetype,
    quantity,
    confidence: conf,
    factory_low_usd: factory[0], factory_base_usd: factory[1], factory_high_usd: factory[2],
    packaging_base_usd: packaging[1], freight_base_usd: freight[1],
    duty_rate_percent: n("dutyRate"),
    landed_low_usd: landed[0], landed_base_usd: landed[1], landed_high_usd: landed[2],
    marketplace_fee_base_usd: marketplace,
    fulfillment_base_usd: n("fulfillment"),
    returns_allowance_base_usd: returns,
    other_cost_base_usd: n("otherCost"),
    total_selling_cost_base_usd: selling[1],
    gross_profit_base_usd: profit[1],
    gross_margin_base_percent: margin[1],
    notes: $("notes").textContent
  };
  localStorage.setItem("lastEstimate", JSON.stringify(lastEstimate));
}

function matchCatalog() {
  const title = $("title").value;
  const url = $("pageUrl").value;
  if (!title && !url) { alert("Enter a product title or URL first."); return; }
  catalogMatch = findCatalogMatch(title, url);
  if (catalogMatch) {
    applyCatalogMatch(catalogMatch);
  } else {
    chooseBenchmark(title);
    $("catalog-badge").classList.add("hidden");
  }
  calculate();
}

function csvEscape(value) {
  const s = String(value ?? "");
  return `"${s.replaceAll('"', '""')}"`;
}

function exportCSV() {
  if (!lastEstimate) calculate();
  const keys = Object.keys(lastEstimate);
  const csv = keys.map(csvEscape).join(",") + "\n" + keys.map(k => csvEscape(lastEstimate[k])).join(",");
  const url = URL.createObjectURL(new Blob([csv], {type: "text/csv"}));
  const a = document.createElement("a");
  a.href = url;
  a.download = "manufacturing_cost_estimate.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

$("category").addEventListener("change", () => { catalogMatch = null; rebuildArchetypes(); calculate(); });
$("archetype").addEventListener("change", () => { catalogMatch = null; calculate(); });
$("match").addEventListener("click", matchCatalog);
$("calculate").addEventListener("click", calculate);
$("export").addEventListener("click", exportCSV);
document.querySelectorAll("input,select").forEach(el => {
  if (el.id === "category" || el.id === "confidenceOverride") return;
  el.addEventListener("change", calculate);
});

loadData().catch(err => console.error("Failed to load data:", err));
