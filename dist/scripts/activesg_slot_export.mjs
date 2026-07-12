#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    config: "data/activesg_config.json",
    out: "data/activesg_slots.csv",
    from: null,
    to: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--config") {
      args.config = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--out") {
      args.out = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--from") {
      args.from = argv[index + 1];
      index += 1;
      continue;
    }

    if (token === "--to") {
      args.to = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function getByPath(input, dotPath) {
  if (!dotPath) {
    return input;
  }

  return dotPath.split(".").reduce((value, key) => {
    if (value == null) {
      return undefined;
    }

    if (Array.isArray(value) && /^\d+$/.test(key)) {
      return value[Number(key)];
    }

    return value[key];
  }, input);
}

function renderTemplate(template, context) {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = getByPath(context, key);
    return value == null ? "" : String(value);
  });
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function enumerateDates(from, to) {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  if (Number.isNaN(cursor.valueOf()) || Number.isNaN(end.valueOf())) {
    throw new Error(`Invalid date range: from=${from}, to=${to}`);
  }

  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows) {
  const headers = [
    "venue_name",
    "facility_type",
    "facility_id",
    "date",
    "start_time",
    "end_time",
    "status",
    "available",
    "price",
    "currency",
    "slot_id",
    "last_seen_at",
    "raw_slot_json",
  ];

  const lines = [headers.join(",")];

  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

async function readConfig(configPath) {
  const text = await fs.readFile(configPath, "utf8");
  return JSON.parse(text);
}

async function loadPayload(requestConfig, context, cwd) {
  const sourceType = requestConfig.sourceType ?? "http";

  if (sourceType === "file") {
    const filePath = path.resolve(cwd, renderTemplate(requestConfig.filePathTemplate, context));
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  }

  if (sourceType !== "http") {
    throw new Error(`Unsupported sourceType: ${sourceType}`);
  }

  const url = renderTemplate(requestConfig.urlTemplate, context);
  const method = requestConfig.method ?? "GET";
  const headers = Object.fromEntries(
    Object.entries(requestConfig.headers ?? {}).map(([key, value]) => [key, renderTemplate(value, context)]),
  );
  const body = requestConfig.bodyTemplate ? renderTemplate(requestConfig.bodyTemplate, context) : undefined;

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error(`Request failed: ${response.status} ${response.statusText}\n${failureBody.slice(0, 500)}`);
  }

  return response.json();
}

function mapSlot(slot, context, extractConfig) {
  const fieldMap = extractConfig.fieldMap ?? {};
  const now = new Date().toISOString();

  return {
    venue_name: context.venueName ?? "",
    facility_type: context.facilityType ?? "",
    facility_id: context.facilityId ?? "",
    date: context.date ?? "",
    start_time: getByPath(slot, fieldMap.startTime ?? "startTime") ?? "",
    end_time: getByPath(slot, fieldMap.endTime ?? "endTime") ?? "",
    status: getByPath(slot, fieldMap.status ?? "status") ?? "",
    available: getByPath(slot, fieldMap.available ?? "available") ?? "",
    price: getByPath(slot, fieldMap.price ?? "price") ?? "",
    currency: getByPath(slot, fieldMap.currency ?? "currency") ?? "",
    slot_id: getByPath(slot, fieldMap.slotId ?? "slotId") ?? "",
    last_seen_at: now,
    raw_slot_json: JSON.stringify(slot),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const configPath = path.resolve(cwd, args.config);
  const outputPath = path.resolve(cwd, args.out);
  const config = await readConfig(configPath);
  const range = config.dateRange ?? {};
  const from = args.from ?? range.from;
  const to = args.to ?? range.to ?? from;

  if (!from || !to) {
    throw new Error("Missing date range. Set dateRange.from/dateRange.to in config or pass --from/--to.");
  }

  const dates = enumerateDates(from, to);
  const facilities = config.facilities ?? [];
  const rows = [];

  for (const facility of facilities) {
    for (const date of dates) {
      const context = { ...facility, date };
      const payload = await loadPayload(config.request ?? {}, context, cwd);
      const arrayPath = config.extract?.slotArrayPath ?? "";
      const slots = getByPath(payload, arrayPath);

      if (!Array.isArray(slots)) {
        throw new Error(`Slot array not found at path "${arrayPath}" for ${facility.venueName} on ${date}.`);
      }

      for (const slot of slots) {
        rows.push(mapSlot(slot, context, config.extract ?? {}));
      }
    }
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, buildCsv(rows), "utf8");

  process.stdout.write(`Wrote ${rows.length} slot rows to ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
