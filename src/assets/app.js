import { ICON_SPRITE, icon } from "./icons.js";
document.addEventListener("DOMContentLoaded", () => {
  document.body.insertAdjacentHTML("afterbegin", ICON_SPRITE);
  if (!location.pathname.includes("admin_panel")) {
    document.body.insertAdjacentHTML("beforeend", `<button class="btn ghost" id="globalGear" style="position:fixed;top:14px;right:14px;z-index:90;padding:9px">${icon("gear","icon-sm")}</button>`);
    document.getElementById("globalGear").onclick = async () => {
      const pin = prompt("Masukkan PIN Admin:");
      if (!pin) return;
      try {
        const d = await api("admin/login", { pin }, "");
        sessionStorage.setItem("alpedia_admin_token", d.t);
        location.href = "/src/admin_panel.html";
      } catch (e) { alert(e.message); }
    };
  }
});

export const TOKEN_KEY = "alpedia_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(route, body = {}, token = getToken()) {
  const res = await fetch("/api/" + route, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 503) location.href = "/src/maintenance.html";
  if (!res.ok) throw new Error(data.e || "Terjadi kesalahan");
  return data;
}

export function requireLogin() {
  if (!getToken()) location.href = "/src/login.html";
}

export function renderTopbar(active = "") {
  const loggedIn = !!getToken();
  const el = document.getElementById("topbar");
  if (!el) return;
  el.innerHTML = `
    <div class="logo g">ALPEDIA</div>
    <div class="navlinks">
      ${loggedIn ? `
        <a class="btn ghost" href="/src/index.html">Home</a>
        <a class="btn ghost" href="/src/dashboard.html">${icon("user","icon-sm")} Dashboard</a>
        <a class="btn ghost" href="/src/profil.html">${icon("gear","icon-sm")} Profil</a>
        <button class="btn danger" id="logoutBtn">${icon("logout","icon-sm")} Logout</button>
      ` : `
        <a class="btn ghost" href="/src/login.html">Login</a>
        <a class="btn" href="/src/register.html">Register</a>
      `}
    </div>`;
  const lb = document.getElementById("logoutBtn");
  if (lb) lb.onclick = async () => { try { await api("auth/logout"); } catch {} clearToken(); location.href = "/src/login.html"; };
}

export function startLoader(nextFn) {
  const loader = document.getElementById("loader");
  setTimeout(() => {
    if (loader) { loader.style.opacity = 0; setTimeout(() => loader.remove(), 500); }
    nextFn && nextFn();
  }, 3500);
}

// Polling realtime ringan: maintenance, broadcast global, status banned
export function startRealtime() {
  async function tick() {
    try {
      const s = await api("state");
      if (s.maintenance) return location.href = "/src/maintenance.html";
      if (s.banned) { clearToken(); alert("Akun kamu dibanned oleh admin."); return location.href = "/src/login.html"; }
      if (s.broadcast && s.broadcast.id != localStorage.getItem("alpedia_bc_seen")) {
        localStorage.setItem("alpedia_bc_seen", s.broadcast.id);
        showPopup(s.broadcast.text);
      }
    } catch {}
  }
  tick();
  setInterval(tick, 5000);
}

export function showPopup(text) {
  let pop = document.getElementById("popup");
  if (!pop) {
    document.body.insertAdjacentHTML("beforeend", `<div id="popup"><div class="box"><p id="popupText"></p><button class="btn" id="popupClose">Oke</button></div></div>`);
    pop = document.getElementById("popup");
    document.getElementById("popupClose").onclick = () => (pop.style.display = "none");
  }
  document.getElementById("popupText").textContent = text;
  pop.style.display = "flex";
}

window.ALPEDIA = { api, getToken, setToken, clearToken, requireLogin, renderTopbar, startLoader, startRealtime, icon };
