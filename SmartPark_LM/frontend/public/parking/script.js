/* ---------- Mock data (replace with API later) ---------- */
const DB = [
  { plate: "กด 4779", prov: "กรุงเทพมหานคร", since: "3:15 PM", floor: "Floor C", zone: "Zone C1", type: "Sedan" },
  { plate: "กด 4779", prov: "แพร่",           since: "1:49 PM", floor: "Floor C", zone: "Zone C1", type: "Pickups" },
  { plate: "ขท 1234", prov: "เชียงใหม่",       since: "9:30 AM", floor: "Floor B", zone: "Zone B2", type: "Sedan" },
  { plate: "กท 5678", prov: "กรุงเทพมหานคร", since: "10:20 AM", floor: "Floor D", zone: "Zone D2", type: "SUV" },
  { plate: "นข 9012", prov: "ชลบุรี",         since: "11:05 AM", floor: "Floor D", zone: "Zone D1", type: "Sedan" }
];
const CAR_IMG = "car.png";

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const norm = s => s.replace(/\s+/g, "");
const views = ["search", "results", "qr", "success"];
/* Paid cars are hidden from search. DEMO: kept in localStorage; replace with backend status. */
const key = c => norm(c.plate) + "|" + c.prov;
let paid = [];
try { paid = JSON.parse(localStorage.getItem("paidCars") || "[]"); } catch (e) {}
DB.forEach(c => { c.paid = paid.includes(key(c)); });
function markPaid(c) {
  c.paid = true;
  paid.push(key(c));
  try { localStorage.setItem("paidCars", JSON.stringify(paid)); } catch (e) {}
}
/* ---------- Zone from the QR link: /parking/D2  or  ?zone=D2 ---------- */
function zoneFromUrl() {
  const seg = location.pathname.split("/").filter(Boolean);
  const i = seg.indexOf("parking");
  const raw = new URLSearchParams(location.search).get("zone") || (i >= 0 ? seg[i + 1] : "") || "";
  const m = decodeURIComponent(raw).trim().toUpperCase().match(/^([A-Z])(\d+)$/);
  return m ? { floor: m[1], zone: m[1] + m[2] } : null;
}
const spot = zoneFromUrl();
if (spot) {
  $("spot").hidden = false;
  $("spot").innerHTML =
    `<span>Floor <b>${spot.floor}</b></span><span>Zone <b>${spot.zone}</b></span>`;
}

let selected = null;
let timer = null;

function show(name) {
  views.forEach(v => $(v).classList.toggle("on", v === name));
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  window.scrollTo(0, 0);
}

function plateHTML(c) {
  return `<div class="plate"><b>${c.plate}</b><span>${c.prov}</span></div>`;
}

function car() {
  return `<img class="car" src="${CAR_IMG}" alt="car">`;
}

/* ---------- Page 1: search ---------- */
function doSearch() {
  const q = norm($("plate").value);
  if (!q) {
    $("err").textContent = "Please enter a license plate number";
    return;
  }
  // When opened from a zone QR, only cars parked in that zone are found.
  const inZone = c => !spot || c.zone.replace("Zone ", "").toUpperCase() === spot.zone;
  const matches = DB.filter(c => norm(c.plate) === q && inZone(c));
  const hits = matches.filter(c => !c.paid);
  if (!matches.length) {
    $("err").textContent = spot ? "ไม่พบรถในช่องนี้" : "Vehicle not found";
    return;
  }
  if (!hits.length) {
    $("err").textContent = "This vehicle has already paid";
    return;
  }
  $("err").textContent = "";
  $("plate2").value = hits[0].plate;
  $("count").textContent = hits.length > 1 ? hits.length + " cars found" : "1 car found";
  $("list").innerHTML = hits.map(c => `
    <div class="res">
      ${plateHTML(c)}
      <div class="row">
        <div class="bay">${car()}</div>
        <dl class="info">
          <div><dt>Parked since</dt><b>${c.since}</b></div>
          <div><dt>Floor</dt><b>${c.floor.replace("Floor ", "")}</b></div>
          <div><dt>Section</dt><b>${c.zone.replace("Zone ", "")}</b></div>
          <div><dt>Vehicle</dt><b>${c.type}</b></div>
        </dl>
      </div>
      <button class="btn pay" data-i="${DB.indexOf(c)}">Pay in advance</button>
    </div>`).join("");
  show("results");
}

$("go").onclick = doSearch;

/* DEMO ONLY: bring all paid cars back */
$("reset").onclick = () => {
  paid = [];
  try { localStorage.removeItem("paidCars"); } catch (e) {}
  DB.forEach(c => { c.paid = false; });
  $("err").textContent = "";
  $("plate").value = "";
};
$("plate").addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });

/* ---------- Page 2: results (pick your car) ---------- */
$("again").onclick = () => show("search");
$("list").onclick = e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  selected = DB[+btn.dataset.i];
  openQR();
};

/* ---------- Page 3: QR payment ---------- */
function drawQR() {
  const n = 29;
  let seed = Math.floor(Math.random() * 1e6);
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const isFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  let rects = "";

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let on;
      if (isFinder(x, y)) {
        const px = x > n - 9 ? x - (n - 7) : x;
        const py = y > n - 9 ? y - (n - 7) : y;
        if (px < 0 || py < 0 || px === 7 || py === 7) on = false;
        else on = px === 0 || px === 6 || py === 0 || py === 6 ||
                  (px >= 2 && px <= 4 && py >= 2 && py <= 4);
      } else {
        on = rand() > 0.5;
      }
      if (on) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  $("qrsvg").innerHTML =
    `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="#000">${rects}</svg>`;
}

function openQR() {
  $("qplate").innerHTML = plateHTML(selected);
  $("qrbox").classList.remove("exp");
  drawQR();

  let t = 300; // 5:00
  clearInterval(timer);
  const tick = () => {
    $("tm").textContent = Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
    if (t-- <= 0) {
      clearInterval(timer);
      $("qrbox").classList.add("exp");
      $("tm").textContent = "Expired";
    }
  };
  tick();
  timer = setInterval(tick, 1000);
  show("qr");
}

$("back").onclick = () => { clearInterval(timer); show("results"); };

/* DEMO ONLY: replace with real payment-status check from your backend */
$("sim").onclick = () => {
  clearInterval(timer);
  $("txn").textContent = "TXN-" + Math.floor(1e8 + Math.random() * 9e8);
  $("dt").textContent = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  $("lp").textContent = selected.plate + " " + selected.prov;
  markPaid(selected);
  show("success");
};

/* ---------- Page 4: payment successful ---------- */
$("home").onclick = () => {
  $("plate").value = "";
  selected = null;
  show("search");
};

show("search");
