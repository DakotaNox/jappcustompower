// ===== Configuración =====
const WHATSAPP_PHONE = "50764952054";   // <-- tu número (solo dígitos, con código de país)
const BRAND_NAME = "JAPP Custom Power";
const CURRENCY = "USD";                 // o "PAB"

// ===== Utilidades =====
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const fmtCurrency = (n) => new Intl.NumberFormat("es-PA", { style: "currency", currency: CURRENCY }).format(n);
const unique = (arr) => [...new Set(arr)];

function buildWhatsAppLink(p, qty = 1) {
  const phone = String(WHATSAPP_PHONE).replace(/\D/g, "");
  const pname = p.name ?? "";
  const text = `Hola! Me interesa "${pname}" x${qty}. Código: ${p.sku}. Precio: ${fmtCurrency(p.price)}. ¿Disponible?`;
  const encoded = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
}

function hydrateBrand() {
  const setText = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };
  const setHref = (sel, href) => { const el = $(sel); if (el) el.href = href; };

  setText("#brand", BRAND_NAME);
  setText("#brand2", BRAND_NAME);
  setText("#brand3", BRAND_NAME);
  setText("#year", new Date().getFullYear());

  const hello = `Hola! Vengo del sitio de ${BRAND_NAME}.`;
  const wl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(hello)}`;
  setHref("#ctaWhatsAppTop", wl);
  setHref("#ctaWhatsAppBottom", wl);
}

function populateCategories(products) {
  const cats = unique(products.map(p => p.category).filter(Boolean)).sort((a,b)=>a.localeCompare(b));
  const sel = $("#category");
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  }
}

function render(products) {
  const grid = $("#grid");
  grid.innerHTML = "";
  if (!products.length) { $("#empty").classList.remove("hidden"); return; }
  $("#empty").classList.add("hidden");

  const tpl = $("#card-template");
  for (const p of products) {
    const node = tpl.content.cloneNode(true);
    const img = node.querySelector("img");
    img.src = p.image || "https://picsum.photos/640/480?blur=2";
    img.onerror = () => { img.onerror = null; img.src = "https://picsum.photos/640/480?blur=2"; };
    img.alt = p.name;
    node.querySelector("h3").textContent = p.name;
    node.querySelector("p").textContent = p.description || "";
    node.querySelector("span").textContent = p.category || "General";
    node.querySelector(".font-semibold").textContent = fmtCurrency(p.price);
    node.querySelector("span.font-mono").textContent = p.sku;

    const qtyInput = node.querySelector("input[type='number']");
    const btn = node.querySelector("a");
    const updateLink = () => btn.href = buildWhatsAppLink(p, Math.max(1, parseInt(qtyInput.value || 1)));
    qtyInput.addEventListener("input", updateLink);
    updateLink();

    grid.appendChild(node);
  }
}

function applyFilters(all) {
  const q = $("#search").value.trim().toLowerCase();
  const c = $("#category").value;
  const s = $("#sort").value;

  let out = all.filter(p => {
    const hitQ = !q || (p.name + " " + (p.description||"")).toLowerCase().includes(q);
    const hitC = !c || p.category === c;
    return hitQ && hitC;
  });

  switch (s) {
    case "precio-asc": out.sort((a,b)=>a.price-b.price); break;
    case "precio-desc": out.sort((a,b)=>b.price-a.price); break;
    case "nombre-asc": out.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "nombre-desc": out.sort((a,b)=>b.name.localeCompare(a.name)); break;
    default: break;
  }

  render(out);
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", async () => {
  hydrateBrand();

  // Carga productos desde JSON (sin CORS problemas en GitHub Pages)
  const res = await fetch("data/products.json");
  const PRODUCTS = await res.json();

  populateCategories(PRODUCTS);
  render(PRODUCTS);

  ["#search", "#category", "#sort"].forEach(sel =>
    $(sel).addEventListener("input", () => applyFilters(PRODUCTS))
  );
});
