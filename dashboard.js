"use strict";

document.addEventListener("DOMContentLoaded", () => {
  startDashboardPresence();
  const button = document.querySelector("#dashboard-fullscreen");
  button.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      button.textContent = "Vollbild mit F11 öffnen";
    }
  });
  document.addEventListener("fullscreenchange", () => {
    button.textContent = document.fullscreenElement ? "Vollbild beenden" : "Vollbild";
  });
});

function startDashboardPresence() {
  const key = "gewichtheben-wettkampf-control-client";
  let token = "";
  try { token = localStorage.getItem(key) || ""; } catch {}
  let pending = false;
  async function heartbeat() {
    if (pending) return;
    pending = true;
    try {
      const response = await fetch("/api/control/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: "Dashboard-PC" }),
      });
      if (!response.ok) return;
      const result = await response.json();
      if (result.token) {
        token = result.token;
        try { localStorage.setItem(key, token); } catch {}
      }
    } catch {
      // Retry automatically while the dashboard reconnects its live data.
    } finally { pending = false; }
  }
  void heartbeat();
  setInterval(heartbeat, 5000);
}
