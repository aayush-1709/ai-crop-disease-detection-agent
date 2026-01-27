document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const desktopToggle = document.getElementById("themeToggle");
  const mobileToggle = document.getElementById("themeToggleMobile");

  const savedTheme = localStorage.getItem("theme") || "light";
  body.setAttribute("data-theme", savedTheme);
  updateIcon(savedTheme);

  function toggleTheme() {
    const current = body.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateIcon(next);
  }

  function updateIcon(theme) {
  const icon = theme === "dark" ? "fa-sun" : "fa-moon";
  if (desktopToggle) {
    desktopToggle.innerHTML = `<i class="fas ${icon}"></i>`;
  }
  if (mobileToggle) {
    mobileToggle.innerHTML = `<i class="fas ${icon}"></i>`;
  }
}


  desktopToggle?.addEventListener("click", toggleTheme);
  mobileToggle?.addEventListener("click", toggleTheme);
});
