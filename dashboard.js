"use strict";

document.addEventListener("DOMContentLoaded", () => {
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
