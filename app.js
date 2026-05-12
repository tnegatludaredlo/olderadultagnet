const pages = Array.from(document.querySelectorAll("[data-screen]"));
const navButtons = Array.from(document.querySelectorAll("[data-nav-target]"));
const backButtons = Array.from(document.querySelectorAll("[data-nav-back], [data-nav-back-target]"));
const clinicTabs = Array.from(document.querySelectorAll("[data-clinic-target]"));

const pageRoutes = {
  home: "index.html",
  registration: "registration/index.html",
  "campus-select": "registration/campus-select/index.html",
  "campus-yuancun": "registration/campus-select/yuancun/index.html",
  "sleep-memory-clinic": "registration/campus-select/yuancun/sleep-memory-clinic/index.html",
  "doctor-source": "registration/campus-select/yuancun/sleep-memory-clinic/doctor-source/index.html",
  "appointment-confirm": "registration/campus-select/yuancun/sleep-memory-clinic/doctor-source/appointment-confirm/index.html",
  "campus-north": "registration/campus-select/north/index.html",
  "campus-knowledge": "registration/campus-select/knowledge/index.html",
};

function getCurrentRouteDepth() {
  const currentScreen = document.querySelector(".app-page[data-screen]")?.dataset.screen;
  const currentRoute = pageRoutes[currentScreen] || pageRoutes.home;

  return currentRoute.split("/").length - 1;
}

function showScreen(target) {
  const route = pageRoutes[target];

  if (route) {
    window.location.href = `${"../".repeat(getCurrentRouteDepth())}${route}`;
    return;
  }

  pages.forEach((page) => {
    page.classList.toggle("is-active", page.dataset.screen === target);
  });
  window.scrollTo(0, 0);
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.navTarget);
  });
});

backButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showScreen(button.dataset.navBackTarget || "home");
  });
});

clinicTabs.forEach((button) => {
  button.addEventListener("click", () => {
    const sidebar = button.closest(".clinic-sidebar");
    const layout = button.closest(".clinic-layout");
    const target = button.dataset.clinicTarget;
    const panels = layout ? Array.from(layout.querySelectorAll("[data-clinic-panel]")) : [];
    const siblings = sidebar ? Array.from(sidebar.querySelectorAll("[data-clinic-target]")) : [];

    siblings.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.clinicPanel === target);
    });
  });
});
