import { format } from "date-fns";

const BASE_URL = "https://api.govinfo.gov";

type GranuleSummary = {
  granuleId: string;
  title: string;
  dateIssued: string;
  category: string;
  granuleClass: string; // HOUSE, SENATE, EXTENSIONS, DIGEST
};

type GranuleListResponse = {
  count: number;
  offset: string;
  pageSize: number;
  nextPage?: string;
  granules: GranuleSummary[];
};

type GranuleDetail = {
  granuleId: string;
  title: string;
  dateIssued: string;
  category: string;
  docClass: string;
  download: {
    htmLink?: string;
    txtLink?: string;
    xmlLink?: string;
    pdfLink?: string;
  };
};

function apiKey(): string {
  const key = process.env.GOVINFO_API_KEY;
  if (!key) throw new Error("GOVINFO_API_KEY is required");
  return key;
}

/**
 * Fetch all granules (individual speeches/entries) from the Congressional Record
 * for a given date. Filters to HOUSE and SENATE floor speeches.
 */
export async function fetchDailySpeechGranules(
  date: Date
): Promise<GranuleSummary[]> {
  const dateStr = format(date, "yyyy-MM-dd");
  const packageId = `CREC-${dateStr}`;
  const allGranules: GranuleSummary[] = [];
  let offset = "*";
  let hasMore = true;

  while (hasMore) {
    const url = `${BASE_URL}/packages/${packageId}/granules?offsetMark=${encodeURIComponent(offset)}&pageSize=100&api_key=${apiKey()}`;
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 404) {
        // No Congressional Record for this date (weekend, recess, etc.)
        return [];
      }
      throw new Error(
        `GovInfo API error: ${res.status} ${res.statusText}`
      );
    }

    const data: GranuleListResponse = await res.json();

    // Filter to floor speeches (HOUSE and SENATE sections only)
    const speeches = data.granules.filter(
      (g) => g.granuleClass === "HOUSE" || g.granuleClass === "SENATE"
    );
    allGranules.push(...speeches);

    if (data.nextPage) {
      // Extract offset from next page URL
      const nextUrl = new URL(data.nextPage);
      offset = nextUrl.searchParams.get("offsetMark") || "*";
    } else {
      hasMore = false;
    }
  }

  return allGranules;
}

/**
 * Fetch the full HTML text of a specific granule (speech).
 */
export async function fetchGranuleHtml(
  date: Date,
  granuleId: string
): Promise<string> {
  const dateStr = format(date, "yyyy-MM-dd");
  const packageId = `CREC-${dateStr}`;
  const url = `${BASE_URL}/packages/${packageId}/granules/${granuleId}/htm?api_key=${apiKey()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch granule HTML: ${res.status} ${res.statusText}`
    );
  }

  return res.text();
}

/**
 * Fetch granule detail (metadata + download links).
 */
export async function fetchGranuleDetail(
  date: Date,
  granuleId: string
): Promise<GranuleDetail> {
  const dateStr = format(date, "yyyy-MM-dd");
  const packageId = `CREC-${dateStr}`;
  const url = `${BASE_URL}/packages/${packageId}/granules/${granuleId}/summary?api_key=${apiKey()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch granule detail: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

/**
 * Strip HTML tags and clean up speech text for LLM processing.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Try to parse speaker name from speech text.
 * Congressional Record typically starts with "Mr. LASTNAME" or "Ms. LASTNAME" etc.
 */
export function parseSpeaker(text: string): string | null {
  // Common patterns: "Mr. SMITH", "Ms. JONES", "Mrs. DAVIS", "The SPEAKER"
  const patterns = [
    /^(?:Mr\.|Ms\.|Mrs\.|Miss)\s+([A-Z][A-Z\s]+?)(?:\s+of\s+\w+)?[.\s]/,
    /^(The\s+(?:SPEAKER|PRESIDENT|CHAIR)(?:\s+pro\s+tempore)?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}
