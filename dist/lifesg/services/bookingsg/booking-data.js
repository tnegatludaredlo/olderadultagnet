const BOOKINGSG_STORAGE_KEY = "bookingsg-iras-booking";

const BOOKINGSG_DEFAULTS = {
  service: "IRAS Video Conferencing",
  centre: "IRAS VC @ ServiceSG Centre Woodlands",
  address: "900 Woodlands South Drive, Singapore 730900",
  date: "2026-06-09",
  dateShort: "09 / 06 / 2026",
  dateLong: "Tuesday 9 June 2026",
  slotStart: "3:30pm",
  slotEnd: "4:00pm",
  name: "",
  nric: "M*****437J",
  email: "",
  countryCode: "+65",
  mobile: "",
  taxType: "",
  remarks: "",
};

function readBookingData() {
  try {
    const raw = sessionStorage.getItem(BOOKINGSG_STORAGE_KEY);
    if (!raw) return { ...BOOKINGSG_DEFAULTS };
    return { ...BOOKINGSG_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...BOOKINGSG_DEFAULTS };
  }
}

function saveBookingData(patch) {
  const next = { ...readBookingData(), ...patch };
  sessionStorage.setItem(BOOKINGSG_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function buildBookingQuery(data) {
  const params = new URLSearchParams();
  params.set("centre", data.centre);
  params.set("address", data.address);
  params.set("date", data.date);
  params.set("dateShort", data.dateShort);
  params.set("dateLong", data.dateLong);
  params.set("slotStart", data.slotStart);
  params.set("slotEnd", data.slotEnd);
  return params.toString();
}

function formatBookingDateLong(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.weekday} ${map.day} ${map.month} ${map.year}`;
}

function formatBookingDateShort(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day} / ${month} / ${year}`;
}

window.BookingSGData = {
  defaults: BOOKINGSG_DEFAULTS,
  read: readBookingData,
  save: saveBookingData,
  buildQuery: buildBookingQuery,
  formatDateLong: formatBookingDateLong,
  formatDateShort: formatBookingDateShort,
};
