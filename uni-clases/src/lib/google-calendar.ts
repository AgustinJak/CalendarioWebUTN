import type { Session } from "./types";

type GCalEvent = {
  id?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method: "popup" | "email"; minutes: number }>;
  };
  extendedProperties?: { private?: Record<string, string> };
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// RFC3339 without timezone offset. When paired with `timeZone`, Google accepts it.
function rfc3339LocalNoOffset(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
}

function toEvent(session: Session, timeZone: string): GCalEvent {
  const descriptionParts: string[] = [];
  if (session.professor) descriptionParts.push(`Docente: ${session.professor}`);
  if (session.liveUrl) descriptionParts.push(`Link: ${session.liveUrl}`);

  return {
    summary: session.title,
    description: descriptionParts.join("\n"),
    start: { dateTime: rfc3339LocalNoOffset(session.start), timeZone },
    end: { dateTime: rfc3339LocalNoOffset(session.end), timeZone },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 10 },
      ],
    },
    extendedProperties: { private: { uniClasesId: session.id } },
  };
}

async function gcalFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

async function listEvents(
  calendarId: string,
  accessToken: string,
  timeMinIso: string,
  timeMaxIso: string,
) {
  type Resp = { items?: Array<GCalEvent & { id?: string }> };
  const params = new URLSearchParams({
    timeMin: timeMinIso,
    timeMax: timeMaxIso,
    singleEvents: "true",
    maxResults: "2500",
    orderBy: "startTime",
  });
  return gcalFetch<Resp>(
    `/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    accessToken,
  );
}

async function insertEvent(calendarId: string, accessToken: string, event: GCalEvent) {
  return gcalFetch<GCalEvent>(
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(event),
    },
  );
}

export async function syncSessionsToGoogleCalendar(opts: {
  sessions: Session[];
  accessToken: string;
  calendarId?: string;
  timeZone: string;
  rangeStart: Date;
  rangeEnd: Date;
}) {
  const {
    sessions,
    accessToken,
    calendarId = "primary",
    timeZone,
    rangeStart,
    rangeEnd,
  } = opts;

  // Use UTC timestamps for querying; Google expects timezone offsets in timeMin/Max.
  const timeMinIso = rangeStart.toISOString();
  const timeMaxIso = rangeEnd.toISOString();
  const existing = await listEvents(calendarId, accessToken, timeMinIso, timeMaxIso);

  const existingIds = new Set<string>();
  for (const item of existing.items ?? []) {
    const id = item.extendedProperties?.private?.uniClasesId;
    if (id) existingIds.add(id);
  }

  let inserted = 0;
  let skipped = 0;
  for (const s of sessions) {
    if (existingIds.has(s.id)) {
      skipped++;
      continue;
    }
    await insertEvent(calendarId, accessToken, toEvent(s, timeZone));
    inserted++;
  }

  return { inserted, skipped };
}

