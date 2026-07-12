const ACTIVESG_STORAGE_KEY = "activesg-mock-booking";
const ACTIVESG_BOOKINGS_STORAGE_KEY = "activesg-mock-bookings";

const ACTIVESG_PROFILE = {
  fullName: "XXX",
  nric: "M46xxx7J",
  mobile: "1234 5678",
  countryCode: "+65",
};

const ACTIVESG_STATE_PRESETS = {
  "badminton-farrer-park-update": {
    id: "asg-preset-badminton-farrer-park-update",
    activityId: "YLONatwvqJfikKOmB5N9U",
    activityName: "Badminton",
    venueId: "WHa3066PaItBKX5ZwvueP",
    venueName: "Farrer Park Primary School Hall",
    venueAddress: {
      line1: "2 FARRER PARK ROAD",
      line2: "(INSIDE FARRER PARK SPORTS HALL)",
      line3: "SINGAPORE 210002",
      full: "2 FARRER PARK ROAD, FARRER PARK SPORTS HALL, SINGAPORE 210002",
      shortLabel: "Farrer Park Road",
    },
    slotDate: "2026-07-03",
    slotTime: "3:00 pm",
    reviewDate: "Fri, 3 Jul, 3:00 pm",
    facility: "Badminton Court 02",
    totalAmount: "S$7.40",
    status: "active",
    paymentStatus: "paid",
    createdAt: "2026-07-01T09:10:00.000Z",
    updatedAt: "2026-07-01T09:10:00.000Z",
    paidAt: "2026-07-01T09:10:00.000Z",
  },
};

const ACTIVESG_GROUPS = [
  {
    title: "Core Sports",
    items: [
      "Badminton",
      "Beach Volleyball",
      "Dance",
      "Floorball",
      "Flying Disc",
      "Handball",
      "Lawn Bowl",
      "Netball",
      "Petanque",
      "Pickleball",
      "Rugby",
      "Squash",
      "Table Tennis",
      "Volleyball",
    ],
  },
  {
    title: "Basketball",
    items: ["Basketball", "Basketball 3x3"],
  },
  {
    title: "Free To Play",
    items: [
      "Free To Play",
      "Free To Play Basketball",
      "Free To Play Flying Disc",
      "Free To Play Pickleball",
    ],
  },
  {
    title: "Soccer",
    items: [
      "Futsal",
      "Soccer",
      "Soccer (5-A-Side)",
      "Soccer (5-A-Side)(Night)",
      "Soccer (7-A-Side)",
    ],
  },
  {
    title: "Hockey",
    items: ["Hockey", "Hockey (Night)"],
  },
  {
    title: "Tennis",
    items: ["Mini Tennis", "Tennis", "Tennis Wall"],
  },
];

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seedValue) {
  let seed = seedValue >>> 0;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function titleCase(value) {
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function readBooking() {
  try {
    const raw = sessionStorage.getItem(ACTIVESG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBooking(patch) {
  const next = { ...readBooking(), ...patch };
  sessionStorage.setItem(ACTIVESG_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function clearBooking() {
  sessionStorage.removeItem(ACTIVESG_STORAGE_KEY);
}

function readBookings() {
  try {
    const raw = sessionStorage.getItem(ACTIVESG_BOOKINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookings(bookings) {
  sessionStorage.setItem(ACTIVESG_BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  return bookings;
}

function clearBookings() {
  sessionStorage.removeItem(ACTIVESG_BOOKINGS_STORAGE_KEY);
  localStorage.removeItem(ACTIVESG_BOOKINGS_STORAGE_KEY);
}

function clearAllBookingState() {
  clearBooking();
  clearBookings();
}

function applyStatePreset(presetId) {
  const preset = ACTIVESG_STATE_PRESETS[presetId];
  if (!preset) return null;

  const booking = {
    ...preset,
  };

  writeBookings([booking]);
  saveBooking(booking);
  return booking;
}

function isReloadNavigation() {
  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  if (navigationEntry && navigationEntry.type) {
    return navigationEntry.type === "reload";
  }

  if (performance.navigation) {
    return performance.navigation.type === 1;
  }

  return false;
}

if (isReloadNavigation()) {
  clearAllBookingState();
}

function createBookingId() {
  return `asg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hasCompleteBooking(booking) {
  return Boolean(
    booking?.activityId &&
      booking?.venueId &&
      booking?.slotDate &&
      booking?.slotTime &&
      booking?.facility &&
      booking?.reviewDate,
  );
}

function compareBookingsByDate(left, right) {
  const leftValue = `${left.slotDate || ""} ${left.slotTime || ""}`;
  const rightValue = `${right.slotDate || ""} ${right.slotTime || ""}`;
  return leftValue.localeCompare(rightValue);
}

function findConfirmedBooking(bookingId) {
  return readBookings().find((booking) => booking.id === bookingId) || null;
}

function confirmBooking() {
  const draft = readBooking();
  if (!hasCompleteBooking(draft)) return null;

  const bookings = readBookings();
  const bookingId = draft.editingBookingId || draft.id || createBookingId();
  const existing = bookings.find((item) => item.id === bookingId);
  const timestamp = new Date().toISOString();
  const confirmed = {
    ...(existing || {}),
    ...draft,
    id: bookingId,
    status: "active",
    paymentStatus: "paid",
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    paidAt: timestamp,
  };

  delete confirmed.editingBookingId;

  const nextBookings = existing
    ? bookings.map((item) => (item.id === bookingId ? confirmed : item))
    : [...bookings, confirmed];

  writeBookings(nextBookings);
  saveBooking(confirmed);
  return confirmed;
}

function cancelConfirmedBooking(bookingId) {
  const timestamp = new Date().toISOString();
  const nextBookings = readBookings().map((booking) =>
    booking.id === bookingId
      ? {
          ...booking,
          status: "cancelled",
          cancelledAt: timestamp,
          updatedAt: timestamp,
        }
      : booking,
  );

  writeBookings(nextBookings);

  const draft = readBooking();
  if (draft.id === bookingId || draft.editingBookingId === bookingId) {
    clearBooking();
  }
}

function startModifyBooking(bookingId) {
  const booking = findConfirmedBooking(bookingId);
  if (!booking) return null;

  const draft = {
    ...booking,
    editingBookingId: booking.id,
  };
  saveBooking(draft);
  return draft;
}

function getUpcomingBookings() {
  return readBookings()
    .filter((booking) => booking.status === "active")
    .sort(compareBookingsByDate);
}

function getPastBookings() {
  return readBookings()
    .filter((booking) => booking.status !== "active")
    .sort(compareBookingsByDate)
    .reverse();
}

function getCatalog() {
  return window.ActiveSGMockCatalog || { activities: [] };
}

function getActivities() {
  return getCatalog().activities || [];
}

function findActivity(activityId) {
  return getActivities().find((item) => item.activityId === activityId) || null;
}

function findActivityByName(activityName) {
  return getActivities().find((item) => item.activityName === activityName) || null;
}

function findVenue(activityId, venueId) {
  const activity = findActivity(activityId);
  if (!activity) return null;
  return activity.venues.find((venue) => venue.venueId === venueId) || null;
}

function formatDateLabel(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${dateString}T12:00:00`));
}

function formatDateCard(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return {
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
    dayMonth: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(date),
  };
}

function formatReviewDate(dateString, timeLabel) {
  const date = new Date(`${dateString}T12:00:00`);
  const prefix = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  return `${prefix}, ${timeLabel}`;
}

function buildTimeLabel(hour) {
  const suffix = hour >= 12 ? "pm" : "am";
  const normalised = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalised}:00 ${suffix}`;
}

function buildFallbackSchedule(activityId, venueId) {
  const seed = hashString(`${activityId}:${venueId}`);
  const rng = createRng(seed);
  const schedule = [];
  let cursor = 1 + Math.floor(rng() * 5);

  for (let index = 0; index < 4; index += 1) {
    const date = new Date(Date.UTC(2026, 6, cursor, 12, 0, 0));
    const dateString = date.toISOString().slice(0, 10);
    const timePool = [7, 8, 9, 10, 11, 14, 15, 16, 19, 20];
    const timeCount = 1 + Math.floor(rng() * 4);
    const chosen = new Set();

    while (chosen.size < timeCount) {
      chosen.add(timePool[Math.floor(rng() * timePool.length)]);
    }

    schedule.push({
      date: dateString,
      card: formatDateCard(dateString),
      times: Array.from(chosen)
        .sort((left, right) => left - right)
        .map((hour) => buildTimeLabel(hour)),
    });

    cursor += 2 + Math.floor(rng() * 4);
  }

  return schedule;
}

function getSchedule(activityId, venueId) {
  const venue = findVenue(activityId, venueId);
  if (Array.isArray(venue?.schedule) && venue.schedule.length > 0) {
    return venue.schedule;
  }
  return buildFallbackSchedule(activityId, venueId);
}

function getNextSlot(activityId, venueId) {
  const [firstDate] = getSchedule(activityId, venueId);
  const [firstTime] = firstDate?.times || [];
  if (!firstDate || !firstTime) {
    return "Slots available Thu, 2 Jul, 10:00 am";
  }
  return `Slots available ${formatDateLabel(firstDate.date)}, ${firstTime}`;
}

function buildFacilityBase(activityName) {
  if (activityName.includes("Dance")) return "Dance Studio";
  if (activityName.includes("Soccer") || activityName.includes("Futsal")) return "Football Pitch";
  if (activityName.includes("Hockey")) return "Hockey Pitch";
  if (activityName.includes("Rugby")) return "Rugby Pitch";
  if (activityName.includes("Flying Disc")) return "Flying Disc Field";
  if (activityName.includes("Floorball")) return "Floorball Court";
  if (activityName.includes("Handball")) return "Handball Court";
  if (activityName.includes("Netball")) return "Netball Court";
  if (activityName.includes("Volleyball")) return "Volleyball Court";
  if (activityName.includes("Badminton")) return "Badminton Court";
  if (activityName.includes("Pickleball")) return "Pickleball Court";
  if (activityName.includes("Table Tennis")) return "Table Tennis Table";
  if (activityName.includes("Tennis")) return "Tennis Court";
  if (activityName.includes("Squash")) return "Squash Court";
  if (activityName.includes("Basketball")) return "Basketball Court";
  if (activityName.includes("Lawn Bowl")) return "Lawn Bowl Green";
  if (activityName.includes("Petanque")) return "Petanque Court";
  if (activityName.includes("Free To Play")) return "Open Play Zone";
  return `${titleCase(activityName)} Facility`;
}

function getFacilities(activityName, venueId, timeLabel) {
  const seed = hashString(`${activityName}:${venueId}:${timeLabel}`);
  const rng = createRng(seed);
  const count = 1 + Math.floor(rng() * 3);
  const base = buildFacilityBase(activityName);
  const facilities = [];

  for (let index = 1; index <= count; index += 1) {
    facilities.push(`${base} ${String(index).padStart(2, "0")}`);
  }

  return facilities;
}

function getGroupedActivities() {
  const activitiesByName = new Map(getActivities().map((item) => [item.activityName, item]));

  return ACTIVESG_GROUPS.map((group) => ({
    title: group.title,
    items: group.items
      .map((name) => activitiesByName.get(name))
      .filter(Boolean),
  })).filter((group) => group.items.length > 0);
}

window.ActiveSGBooking = {
  applyStatePreset,
  profile: ACTIVESG_PROFILE,
  cancelConfirmedBooking,
  clearAllBookingState,
  clearBooking,
  clearBookings,
  confirmBooking,
  findActivity,
  findActivityByName,
  findConfirmedBooking,
  findVenue,
  formatReviewDate,
  getActivities,
  getFacilities,
  getGroupedActivities,
  getNextSlot,
  getPastBookings,
  getSchedule,
  getUpcomingBookings,
  hasCompleteBooking,
  readBooking,
  readBookings,
  saveBooking,
  startModifyBooking,
};
