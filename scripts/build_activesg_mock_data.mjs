import fs from "node:fs/promises";

const inputPath = process.argv[2] || "data/activesg_all_activity_venues.json";
const outputPath = process.argv[3] || "lifesg/services/activesg/activesg-mock-data.js";

const hashString = (value) => {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
};

const roads = [
  "ANG MO KIO AVENUE",
  "BEDOK NORTH ROAD",
  "JURONG WEST STREET",
  "TAMPINES CENTRAL",
  "YISHUN RING ROAD",
  "PUNGGOL DRIVE",
  "SENGKANG EAST WAY",
  "WOODLANDS AVENUE",
  "CHOA CHU KANG LOOP",
  "PASIR RIS DRIVE",
];

const areas = [
  "SPORTS COMPLEX",
  "COMMUNITY SPORTS HUB",
  "ACTIVE GROUNDS",
  "RECREATION CENTRE",
  "SPORT VILLAGE",
  "OUTDOOR ARENA",
  "TRAINING COURTS",
  "LEISURE HUB",
];

const titleCaseUpper = (value) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const buildTimeLabel = (hour) => {
  const suffix = hour >= 12 ? "pm" : "am";
  const normalised = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalised}:00 ${suffix}`;
};

const formatDateCard = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`);
  return {
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
    dayMonth: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(date),
  };
};

const buildSchedule = (activityId, venueId) => {
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
};

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

const buildAddress = (venueName, venueId) => {
  const seed = hashString(`${venueName}:${venueId}`);
  const road = roads[seed % roads.length];
  const area = areas[(seed >>> 3) % areas.length];
  const streetNumber = 20 + (seed % 860);
  const avenueNumber = ((seed >>> 7) % 12) + 1;
  const postal = String(100000 + (seed % 899999)).padStart(6, "0");

  return {
    line1: `${streetNumber} ${road} ${avenueNumber}`,
    line2: `(INSIDE ${area})`,
    line3: `SINGAPORE ${postal}`,
    full: `${streetNumber} ${road} ${avenueNumber}, ${area}, SINGAPORE ${postal}`,
    shortLabel: titleCaseUpper(road),
  };
};

const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));

const activities = payload.results
  .map((activity) => ({
    activityId: activity.activity_id,
    activityName: activity.activity_name,
    venueCount: activity.rows.length,
    venues: activity.rows.map((row) => ({
      venueId: row.venue_id,
      venueName: row.venue_name,
      venueUrl: row.venue_url,
      address: buildAddress(row.venue_name, row.venue_id),
      schedule: buildSchedule(activity.activity_id, row.venue_id),
    })),
  }))
  .sort((a, b) => a.activityName.localeCompare(b.activityName));

const output = `window.ActiveSGMockCatalog = ${JSON.stringify(
  {
    generatedAt: payload.scraped_at,
    activityCount: activities.length,
    activities,
  },
  null,
  2,
)};
`;

await fs.writeFile(outputPath, output);
console.log(
  JSON.stringify(
    {
      inputPath,
      outputPath,
      activityCount: activities.length,
      venueCount: activities.reduce((sum, item) => sum + item.venues.length, 0),
    },
    null,
    2,
  ),
);
