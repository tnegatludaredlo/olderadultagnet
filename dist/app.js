const pages = Array.from(document.querySelectorAll("[data-screen]"));
const navButtons = Array.from(document.querySelectorAll("[data-nav-target]"));
const hrefButtons = Array.from(document.querySelectorAll("[data-nav-href]"));
const backButtons = Array.from(document.querySelectorAll("[data-nav-back], [data-nav-back-target]"));
const clinicTabs = Array.from(document.querySelectorAll("[data-clinic-target]"));

const pageRoutes = {
  home: "hospital/index.html",
  health: "health/index.html",
  messages: "messages/index.html",
  mine: "mine/index.html",
  "patient-list": "mine/patients/index.html",
  "patient-bind": "mine/patients/bind/index.html",
  registration: "registration/index.html",
  "online-clinic": "online-clinic/index.html",
  "campus-select": "registration/campus-select/index.html",
  "campus-yuancun": "registration/campus-select/yuancun/index.html",
  "sleep-memory-clinic": "registration/campus-select/yuancun/sleep-memory-clinic/index.html",
  "doctor-source": "registration/campus-select/yuancun/sleep-memory-clinic/doctor-source/index.html",
  "appointment-confirm": "registration/campus-select/yuancun/sleep-memory-clinic/doctor-source/appointment-confirm/index.html",
  "snore-clinic": "registration/campus-select/yuancun/snore-clinic/index.html",
  "snore-clinic-0515": "registration/campus-select/yuancun/snore-clinic-0515/index.html",
  "snore-clinic-0518": "registration/campus-select/yuancun/snore-clinic-0518/index.html",
  "snore-clinic-0519": "registration/campus-select/yuancun/snore-clinic-0519/index.html",
  "snore-doctor-source": "registration/campus-select/yuancun/snore-clinic/doctor-source/index.html",
  "snore-deng-source-0515": "registration/campus-select/yuancun/deng-source-0515/index.html",
  "snore-long-source": "registration/campus-select/yuancun/long-source/index.html",
  "snore-liu-source": "registration/campus-select/yuancun/liu-source/index.html",
  "snore-appointment-confirm": "registration/campus-select/yuancun/snore-clinic/doctor-source/appointment-confirm/index.html",
  "campus-north": "registration/campus-select/north/index.html",
  "campus-knowledge": "registration/campus-select/knowledge/index.html",
};

function getCurrentRouteDepth() {
  const currentScreen = document.querySelector("[data-screen]")?.dataset.screen;
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

hrefButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.location.href = button.dataset.navHref;
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

document.addEventListener("click", (event) => {
  const hrefButton = event.target.closest("[data-nav-href]");

  if (hrefButton) {
    event.preventDefault();
    window.location.href = hrefButton.dataset.navHref;
    return;
  }

  const targetButton = event.target.closest("[data-nav-target]");

  if (targetButton) {
    event.preventDefault();
    showScreen(targetButton.dataset.navTarget);
    return;
  }

  const backButton = event.target.closest("[data-nav-back], [data-nav-back-target]");

  if (backButton) {
    event.preventDefault();
    showScreen(backButton.dataset.navBackTarget || "home");
  }
});
