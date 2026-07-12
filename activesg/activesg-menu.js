function buildActiveSGMenu(currentPage) {
  const rootPrefix = document.body.dataset.activesgRoot || "./";
  const items = [
    { id: "home", label: "Home", href: `${rootPrefix}index.html`, icon: "home" },
    { id: "bookings", label: "Bookings", href: `${rootPrefix}bookings/index.html`, icon: "bookings" },
    { id: "programmes", label: "Programmes", href: null, icon: "programmes" },
    { id: "passes", label: "Passes", href: null, icon: "passes" },
    { id: "profile", label: "Profile", href: null, icon: "profile" },
    { id: "linked", label: "Linked accounts", href: null, icon: "linked" },
    { id: "payments", label: "Payment methods", href: null, icon: "payments" },
    { id: "crowd", label: "Gym and pool crowd", href: null, icon: "crowd" },
    { id: "logout", label: "Log out", href: null, icon: "logout" },
  ];

  return `
    <div class="activesg-menu-sheet" role="dialog" aria-modal="true" aria-label="ActiveSG menu">
      <button class="activesg-menu-backdrop" type="button" data-activesg-menu-close aria-label="Close menu"></button>
      <div class="activesg-menu-panel">
        ${items
          .map((item) => {
            const classes = [
              "activesg-menu-item",
              item.id === currentPage ? "is-active" : "",
              item.href ? "is-link" : "is-disabled",
            ]
              .filter(Boolean)
              .join(" ");

            const content = `
              <span class="activesg-menu-item__icon activesg-menu-item__icon--${item.icon}" aria-hidden="true"></span>
              <span>${item.label}</span>
            `;

            if (item.href) {
              return `<a class="${classes}" href="${item.href}">${content}</a>`;
            }

            return `<button class="${classes}" type="button">${content}</button>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function mountActiveSGMenu() {
  const currentPage = document.body.dataset.activesgPage || "";
  const triggers = Array.from(document.querySelectorAll("[data-activesg-menu-trigger]"));
  if (!triggers.length) return;
  const shellHost = document.querySelector(".lifesg-shell");
  if (!shellHost) return;

  const shell = document.createElement("div");
  shell.className = "activesg-menu-root";
  shell.innerHTML = buildActiveSGMenu(currentPage);
  shellHost.appendChild(shell);

  const sheet = shell.querySelector(".activesg-menu-sheet");
  const closeButtons = Array.from(shell.querySelectorAll("[data-activesg-menu-close]"));

  function setOpen(isOpen) {
    sheet.classList.toggle("is-open", isOpen);
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      setOpen(!sheet.classList.contains("is-open"));
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
}

window.ActiveSGMenu = {
  mount: mountActiveSGMenu,
};
