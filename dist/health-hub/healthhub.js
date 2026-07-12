(function () {
  const serviceKey = "healthhub.selectedService";
  const locationKey = "healthhub.selectedLocation";
  const requestKey = "healthhub.appointmentRequest";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const minYear = 1900;
  const maxYear = 2026;
  const calendarState = {
    mode: "years",
    year: 2026,
    month: 4,
    decadeStart: 2020,
  };

  function textFromItem(item, selector) {
    const target = selector ? item.querySelector(selector) : item;
    return target ? target.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function renderChoice(card, label, value, emptyText) {
    if (!card) return;

    const hasValue = Boolean(value);
    card.classList.toggle("hh-choice-card--empty", !hasValue);
    card.innerHTML = hasValue
      ? `<span><em>${label}</em><strong>${value}</strong></span><b>Change</b>`
      : `<span>${emptyText}</span><b>Select</b>`;
  }

  function formatDate(day, month, year) {
    return `${day} ${monthNames[month]} ${year}`;
  }

  function isFutureDate(day, month, year) {
    const date = new Date(year, month, day);
    const max = new Date(maxYear, 4, 18);
    return date > max;
  }

  function setDateValue(dateField, value) {
    const input = dateField?.querySelector("[data-hh-date-input]");
    const display = dateField?.querySelector("[data-hh-date-display]");
    if (input) input.value = value;
    if (display) display.textContent = value || "DD MMM YYYY";
    dateField?.classList.remove("is-open");
    updateRequestSubmitState();
  }

  function renderCalendar(calendar) {
    if (!calendar) return;

    if (calendarState.mode === "years") {
      const years = [];
      for (let year = calendarState.decadeStart - 1; year <= calendarState.decadeStart + 10; year += 1) {
        const disabled = year < minYear || year > maxYear;
        years.push(
          `<button type="button" class="${disabled ? "muted" : ""}" ${disabled ? "disabled" : ""} data-hh-calendar-year="${year}">${year}</button>`
        );
      }
      calendar.innerHTML = `
        <div class="hh-calendar-picker__top hh-calendar-picker__top--wide">
          <button type="button" data-hh-calendar-prev-decade aria-label="Previous decade">&laquo;</button>
          <strong>${calendarState.decadeStart}-${calendarState.decadeStart + 9}</strong>
          <button type="button" data-hh-calendar-next-decade aria-label="Next decade">&raquo;</button>
        </div>
        <div class="hh-calendar-picker__grid hh-calendar-picker__years">${years.join("")}</div>
      `;
      return;
    }

    if (calendarState.mode === "months") {
      calendar.innerHTML = `
        <div class="hh-calendar-picker__top hh-calendar-picker__top--wide">
          <button type="button" data-hh-calendar-prev-year aria-label="Previous year">&laquo;</button>
          <strong data-hh-calendar-title>${calendarState.year}</strong>
          <button type="button" data-hh-calendar-next-year aria-label="Next year">&raquo;</button>
        </div>
        <div class="hh-calendar-picker__grid hh-calendar-picker__months">
          ${monthNames.map((month, index) => {
            const disabled = calendarState.year === maxYear && index > 4;
            return `<button type="button" class="${index === calendarState.month ? "selected" : ""} ${disabled ? "muted" : ""}" ${disabled ? "disabled" : ""} data-hh-calendar-month="${index}">${month}</button>`;
          }).join("")}
        </div>
      `;
      return;
    }

    const firstDay = new Date(calendarState.year, calendarState.month, 1).getDay();
    const daysInMonth = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
    const prevDaysInMonth = new Date(calendarState.year, calendarState.month, 0).getDate();
    const dayButtons = [];

    for (let index = 0; index < 42; index += 1) {
      const day = index - firstDay + 1;
      let label = day;
      let muted = false;
      let disabled = false;
      let value = "";

      if (day < 1) {
        label = prevDaysInMonth + day;
        muted = true;
        disabled = true;
      } else if (day > daysInMonth) {
        label = day - daysInMonth;
        muted = true;
        disabled = true;
      } else {
        disabled = isFutureDate(day, calendarState.month, calendarState.year);
        muted = disabled;
        value = formatDate(day, calendarState.month, calendarState.year);
      }

      dayButtons.push(
        `<button type="button" class="${muted ? "muted" : ""}" ${disabled ? "disabled" : ""} ${value ? `data-hh-date-value="${value}"` : ""}>${label}</button>`
      );
    }

    calendar.innerHTML = `
      <div class="hh-calendar-picker__top">
        <button type="button" data-hh-calendar-years aria-label="Choose year">&laquo;</button>
        <button type="button" data-hh-calendar-months aria-label="Choose month">&lsaquo;</button>
        <strong data-hh-calendar-months>${monthNames[calendarState.month]}&nbsp;&nbsp;${calendarState.year}</strong>
        <button type="button" data-hh-calendar-next-month aria-label="Next month">&rsaquo;</button>
        <button type="button" data-hh-calendar-next-year aria-label="Next year">&raquo;</button>
      </div>
      <div class="hh-calendar-picker__week">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>
      <div class="hh-calendar-picker__days">${dayButtons.join("")}</div>
      <button class="hh-calendar-picker__today" type="button" data-hh-date-value="18 May 2026">Today</button>
    `;
  }

  function openCalendar(dateField) {
    const calendar = dateField?.querySelector("[data-hh-calendar]");
    document.querySelectorAll(".hh-date-input.is-open").forEach((field) => {
      if (field !== dateField) field.classList.remove("is-open");
    });
    calendarState.mode = "years";
    calendarState.decadeStart = Math.floor(calendarState.year / 10) * 10;
    renderCalendar(calendar);
    dateField?.classList.add("is-open");
  }

  function shiftMonth(delta) {
    const next = new Date(calendarState.year, calendarState.month + delta, 1);
    calendarState.year = Math.min(maxYear, Math.max(minYear, next.getFullYear()));
    calendarState.month = next.getMonth();
    if (calendarState.year === maxYear && calendarState.month > 4) calendarState.month = 4;
  }

  document.addEventListener("click", (event) => {
    const dropdownButton = event.target.closest("[data-hh-dropdown-button]");
    if (dropdownButton) {
      const dropdown = dropdownButton.closest("[data-hh-dropdown]");
      dropdown?.classList.toggle("is-open");
      return;
    }

    const dropdownOption = event.target.closest("[data-hh-dropdown-menu] button");
    if (dropdownOption) {
      const dropdown = dropdownOption.closest("[data-hh-dropdown]");
      const label = dropdown?.querySelector("[data-hh-service-dropdown-label]");
      const value = textFromItem(dropdownOption);
      if (label && value) {
        label.textContent = value;
        label.dataset.value = value;
      }
      dropdown?.classList.remove("is-open");
      updateRequestSubmitState();
      return;
    }

    const dateTrigger = event.target.closest("[data-hh-date-input], [data-hh-date-icon]");
    if (dateTrigger) {
      const dateField = dateTrigger.closest(".hh-date-input");
      if (dateField?.classList.contains("is-open")) {
        dateField.classList.remove("is-open");
      } else {
        openCalendar(dateField);
      }
      return;
    }

    const calendar = event.target.closest("[data-hh-calendar]");
    if (calendar) {
      const dateField = calendar.closest(".hh-date-input");

      if (event.target.closest("[data-hh-calendar-prev-decade]")) {
        calendarState.decadeStart = Math.max(minYear, calendarState.decadeStart - 10);
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-next-decade]")) {
        calendarState.decadeStart = Math.min(Math.floor(maxYear / 10) * 10, calendarState.decadeStart + 10);
        renderCalendar(calendar);
        return;
      }
      const yearButton = event.target.closest("[data-hh-calendar-year]");
      if (yearButton) {
        calendarState.year = Number(yearButton.dataset.hhCalendarYear);
        calendarState.mode = "months";
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-prev-year]")) {
        calendarState.year = Math.max(minYear, calendarState.year - 1);
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-next-year]")) {
        calendarState.year = Math.min(maxYear, calendarState.year + 1);
        renderCalendar(calendar);
        return;
      }
      const monthButton = event.target.closest("[data-hh-calendar-month]");
      if (monthButton) {
        calendarState.month = Number(monthButton.dataset.hhCalendarMonth);
        calendarState.mode = "days";
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-years]")) {
        calendarState.mode = "years";
        calendarState.decadeStart = Math.floor(calendarState.year / 10) * 10;
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-months]")) {
        calendarState.mode = "months";
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-next-month]")) {
        shiftMonth(1);
        renderCalendar(calendar);
        return;
      }
      if (event.target.closest("[data-hh-calendar-next-year]")) {
        calendarState.year = Math.min(maxYear, calendarState.year + 1);
        renderCalendar(calendar);
        return;
      }
      const dateOption = event.target.closest("[data-hh-date-value]");
      if (dateOption) {
        setDateValue(dateField, dateOption.dataset.hhDateValue);
        return;
      }
      return;
    }

    if (!event.target.closest("[data-hh-dropdown]")) {
      document.querySelectorAll("[data-hh-dropdown].is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
      });
    }

    const serviceItem = event.target.closest(".hh-service-list a");
    if (serviceItem) {
      const value = textFromItem(serviceItem);
      if (value) localStorage.setItem(serviceKey, value);
      return;
    }

    const locationItem = event.target.closest(".hh-location-list a");
    if (locationItem) {
      const value = textFromItem(locationItem, "strong");
      if (value) localStorage.setItem(locationKey, value);
    }
  });

  document.addEventListener("input", updateRequestSubmitState);
  document.addEventListener("change", updateRequestSubmitState);

  function valueOf(selector) {
    const element = document.querySelector(selector);
    return element ? element.value.trim() : "";
  }

  function checkedValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  function requestFormData() {
    return {
      location: localStorage.getItem(locationKey) || "",
      appointmentType: checkedValue("appointmentType"),
      referredBy: checkedValue("referredBy"),
      description: valueOf("[data-hh-field='description']"),
      requestService: document.querySelector("[data-hh-service-dropdown-label]")?.dataset.value || "",
      doctor: valueOf("[data-hh-field='doctor']"),
      behalf: checkedValue("behalf"),
      patient: "MXXXX437J",
      fullName: valueOf("[data-hh-field='fullName']"),
      contact: valueOf("[data-hh-field='contact']"),
      dateOfBirth: valueOf("[data-hh-date-input]"),
      email: valueOf("[data-hh-field='email']"),
    };
  }

  function requestFormComplete(data) {
    return Boolean(
      data.location &&
        data.appointmentType &&
        data.description &&
        data.fullName &&
        data.contact &&
        data.dateOfBirth &&
        data.email
    );
  }

  function updateRequestSubmitState() {
    const submit = document.querySelector("[data-hh-submit]");
    if (!submit) return;

    const data = requestFormData();
    const complete = requestFormComplete(data);
    submit.disabled = !complete;
    submit.classList.toggle("is-ready", complete);
  }

  function bindRequestSubmit() {
    const submit = document.querySelector("[data-hh-submit]");
    if (!submit) return;

    submit.addEventListener("click", () => {
      const data = requestFormData();
      if (!requestFormComplete(data)) return;
      localStorage.setItem(requestKey, JSON.stringify(data));
      window.location.href = "./confirmation/index.html";
    });
  }

  function renderConfirmation() {
    const fields = Array.from(document.querySelectorAll("[data-hh-confirm]"));
    if (!fields.length) return;

    let data = {};
    try {
      data = JSON.parse(localStorage.getItem(requestKey) || "{}");
    } catch (error) {
      data = {};
    }

    fields.forEach((field) => {
      const key = field.dataset.hhConfirm;
      field.textContent = data[key] || (key === "requestService" ? "Not selected" : "-");
    });
  }

  function renderServiceEmpty() {
    const titleElement = document.querySelector("[data-hh-empty-title]");
    if (!titleElement) return;

    const params = new URLSearchParams(window.location.search);
    const title = params.get("title") || "Lab Reports";
    const emptyName = params.get("empty") || title.toLowerCase();
    const emptyNameElement = document.querySelector("[data-hh-empty-name]");

    document.title = title;
    titleElement.textContent = title;
    if (emptyNameElement) emptyNameElement.textContent = emptyName;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const selectedLocation = localStorage.getItem(locationKey) || "";

    renderChoice(
      document.querySelector("[data-hh-selected-service]"),
      "Service Type",
      localStorage.getItem(serviceKey) || "Doctor Consultation",
      "Service Type"
    );
    renderChoice(
      document.querySelector("[data-hh-selected-location]"),
      "Location",
      selectedLocation,
      "Location"
    );

    const requestLocation = document.querySelector("[data-hh-request-location]");
    if (requestLocation) {
      requestLocation.textContent = selectedLocation || "Please select an institution";
    }

    bindRequestSubmit();
    updateRequestSubmitState();
    renderConfirmation();
    renderServiceEmpty();
  });
})();
