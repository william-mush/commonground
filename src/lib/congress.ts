const BASE_URL = "https://api.congress.gov/v3";

function apiKey(): string {
  const key = process.env.CONGRESS_API_KEY || process.env.GOVINFO_API_KEY;
  if (!key) throw new Error("CONGRESS_API_KEY or GOVINFO_API_KEY is required");
  return key;
}

// --- Types ---

export type BillListItem = {
  congress: number;
  type: string; // HR, S, HJRES, SJRES
  number: number;
  title: string;
  latestAction: {
    actionDate: string;
    text: string;
  } | null;
  url: string;
};

export type BillDetail = {
  congress: number;
  type: string;
  number: number;
  originChamber: string;
  title: string;
  introducedDate: string;
  sponsors: {
    bioguideId: string;
    fullName: string;
    party: string;
    state: string;
  }[];
  policyArea?: { name: string };
  latestAction?: {
    actionDate: string;
    text: string;
  };
  actions?: {
    url: string;
  };
  laws?: { number: string; type: string }[];
};

export type Cosponsor = {
  bioguideId: string;
  fullName: string;
  party: string;
  state: string;
  sponsorshipDate: string;
  isOriginalCosponsor: boolean;
};

export type BillSubjects = {
  legislativeSubjects: { name: string }[];
  policyArea?: { name: string };
};

// --- API Functions ---

export async function fetchRecentBills(
  congress: string,
  type: string,
  limit: number = 50
): Promise<BillListItem[]> {
  const url = `${BASE_URL}/bill/${congress}/${type}?api_key=${apiKey()}&limit=${Math.min(limit, 250)}&sort=updateDate+desc`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Congress.gov API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.bills || [];
}

export async function fetchBillDetail(
  congress: string,
  type: string,
  number: string
): Promise<BillDetail> {
  const url = `${BASE_URL}/bill/${congress}/${type}/${number}?api_key=${apiKey()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch bill detail: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.bill;
}

export async function fetchBillCosponsors(
  congress: string,
  type: string,
  number: string
): Promise<Cosponsor[]> {
  const url = `${BASE_URL}/bill/${congress}/${type}/${number}/cosponsors?api_key=${apiKey()}&limit=250`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch cosponsors: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.cosponsors || [];
}

export async function fetchBillSubjects(
  congress: string,
  type: string,
  number: string
): Promise<BillSubjects> {
  const url = `${BASE_URL}/bill/${congress}/${type}/${number}/subjects?api_key=${apiKey()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch subjects: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    legislativeSubjects: data.legislativeSubjects || [],
    policyArea: data.policyArea || undefined,
  };
}

// --- Scoring & Classification ---

export function calculateBipartisanScore(rCount: number, dCount: number): number {
  if (rCount === 0 || dCount === 0) return 0;
  return Math.round((Math.min(rCount, dCount) / Math.max(rCount, dCount)) * 100) / 100;
}

export function deriveBillStatus(latestActionText: string | null): string {
  if (!latestActionText) return "introduced";
  const text = latestActionText.toLowerCase();

  if (text.includes("became public law") || text.includes("signed by president")) return "enacted";
  if (text.includes("vetoed")) return "vetoed";
  if (text.includes("passed senate") && text.includes("passed house")) return "passed_both";
  if (text.includes("received in the senate") || text.includes("received in the house")) return "passed_one";
  if (text.includes("passed house") || text.includes("passed senate")) return "passed_one";
  if (text.includes("placed on") || text.includes("motion to proceed")) return "floor";
  if (text.includes("reported") || text.includes("ordered to be reported")) return "committee";
  if (text.includes("referred to")) return "introduced";

  return "introduced";
}

export function isAdvancedBill(latestActionText: string | null): boolean {
  const status = deriveBillStatus(latestActionText);
  return ["committee", "floor", "passed_one", "passed_both", "enacted"].includes(status);
}

export function formatBillId(type: string, number: string): string {
  const typeMap: Record<string, string> = {
    hr: "H.R.",
    s: "S.",
    hjres: "H.J.Res.",
    sjres: "S.J.Res.",
    hconres: "H.Con.Res.",
    sconres: "S.Con.Res.",
    hres: "H.Res.",
    sres: "S.Res.",
  };
  return `${typeMap[type.toLowerCase()] || type.toUpperCase()} ${number}`;
}
