import fs from "node:fs/promises";

const inputPath = process.argv[2] || "/tmp/activesg_all_activity_venues.json";
const outputDir = process.argv[3] || "data";

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toCsv = (rows, headers) => {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
};

const payload = JSON.parse(await fs.readFile(inputPath, "utf8"));
const activityVenueRows = payload.results.flatMap((result) => result.rows);

const dedupedVenueMap = new Map();
for (const row of activityVenueRows) {
  const existing = dedupedVenueMap.get(row.venue_id);
  if (!existing) {
    dedupedVenueMap.set(row.venue_id, {
      venue_name: row.venue_name,
      venue_id: row.venue_id,
      sample_venue_url: row.venue_url,
      activity_names: [row.activity_name],
      activity_ids: [row.activity_id],
    });
    continue;
  }

  if (!existing.activity_names.includes(row.activity_name)) {
    existing.activity_names.push(row.activity_name);
  }
  if (!existing.activity_ids.includes(row.activity_id)) {
    existing.activity_ids.push(row.activity_id);
  }
}

const dedupedVenueRows = Array.from(dedupedVenueMap.values())
  .map((row) => ({
    venue_name: row.venue_name,
    venue_id: row.venue_id,
    sample_venue_url: row.sample_venue_url,
    activity_names: row.activity_names.join(" | "),
    activity_ids: row.activity_ids.join(" | "),
  }))
  .sort((a, b) => a.venue_name.localeCompare(b.venue_name));

const sortedActivityVenueRows = [...activityVenueRows].sort((a, b) => {
  const byActivity = a.activity_name.localeCompare(b.activity_name);
  if (byActivity !== 0) return byActivity;
  return a.venue_name.localeCompare(b.venue_name);
});

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  `${outputDir}/activesg_activity_venues.csv`,
  toCsv(sortedActivityVenueRows, [
    "activity_name",
    "activity_id",
    "venue_name",
    "venue_id",
    "venue_url",
  ]),
);
await fs.writeFile(
  `${outputDir}/activesg_venues_deduped.csv`,
  toCsv(dedupedVenueRows, [
    "venue_name",
    "venue_id",
    "sample_venue_url",
    "activity_names",
    "activity_ids",
  ]),
);
await fs.writeFile(
  `${outputDir}/activesg_all_activity_venues.json`,
  JSON.stringify(payload, null, 2),
);

console.log(
  JSON.stringify(
    {
      scraped_at: payload.scraped_at,
      activity_count: payload.activity_count,
      activity_venue_rows: sortedActivityVenueRows.length,
      unique_venues: dedupedVenueRows.length,
      output_files: [
        `${outputDir}/activesg_activity_venues.csv`,
        `${outputDir}/activesg_venues_deduped.csv`,
        `${outputDir}/activesg_all_activity_venues.json`,
      ],
    },
    null,
    2,
  ),
);
