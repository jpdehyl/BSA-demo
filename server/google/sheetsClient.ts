import { google } from "googleapis";
import type { InsertLead } from "@shared/schema";

export const SHEETS_CONFIG = {
  LEADS_SPREADSHEET_ID: process.env.LEADS_SPREADSHEET_ID || "",
};

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export interface SpreadsheetInfo {
  title: string;
  sheets: Array<{ sheetId: number; title: string }>;
}

export async function getSpreadsheetInfo(spreadsheetId?: string): Promise<SpreadsheetInfo> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId || SHEETS_CONFIG.LEADS_SPREADSHEET_ID,
  });

  const sheetsData = (response.data.sheets || []).map((sheet) => ({
    sheetId: sheet.properties?.sheetId ?? 0,
    title: sheet.properties?.title || "Unknown",
  }));

  return {
    title: response.data.properties?.title || "Unknown",
    sheets: sheetsData,
  };
}

export interface SheetData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export async function fetchLeadsFromSheet(
  spreadsheetId?: string,
  range: string = "Sheet1!A:Z"
): Promise<SheetData> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId || SHEETS_CONFIG.LEADS_SPREADSHEET_ID,
    range,
  });

  const values = response.data.values || [];
  if (values.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  const headers = values[0].map((h: unknown) => String(h).toLowerCase().trim());
  const rows = values.slice(1);

  console.log(`[Sheets] Fetched ${rows.length} rows with headers: ${headers.join(", ")}`);

  return { headers, rows, totalRows: rows.length };
}

function findColumnIndex(headers: string[], ...possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => 
      h.includes(name.toLowerCase()) || 
      name.toLowerCase().includes(h)
    );
    if (index !== -1) return index;
  }
  return -1;
}

export interface ColumnMapping {
  companyName: number;
  companyWebsite: number;
  companyIndustry: number;
  companySize: number;
  contactName: number;
  contactTitle: number;
  contactEmail: number;
  contactPhone: number;
  contactLinkedIn: number;
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  return {
    companyName: findColumnIndex(headers, "company", "company name", "organization", "account"),
    companyWebsite: findColumnIndex(headers, "website", "company website", "domain", "url"),
    companyIndustry: findColumnIndex(headers, "industry", "sector", "vertical"),
    companySize: findColumnIndex(headers, "size", "company size", "employees", "headcount"),
    contactName: findColumnIndex(headers, "contact name", "name", "full name", "contact", "first name"),
    contactTitle: findColumnIndex(headers, "title", "job title", "position", "role"),
    contactEmail: findColumnIndex(headers, "email", "contact email", "email address", "e-mail"),
    contactPhone: findColumnIndex(headers, "phone", "phone number", "mobile", "telephone"),
    contactLinkedIn: findColumnIndex(headers, "linkedin", "linkedin url", "profile", "linkedin profile"),
  };
}

export function parseLeadsFromSheet(
  headers: string[],
  rows: string[][],
  customMapping?: Partial<ColumnMapping>
): { leads: InsertLead[]; skipped: number; errors: string[] } {
  const mapping = { ...detectColumnMapping(headers), ...customMapping };
  const leads: InsertLead[] = [];
  const errors: string[] = [];
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    
    const companyName = mapping.companyName >= 0 ? row[mapping.companyName]?.trim() : undefined;
    const contactName = mapping.contactName >= 0 ? row[mapping.contactName]?.trim() : undefined;
    const contactEmail = mapping.contactEmail >= 0 ? row[mapping.contactEmail]?.trim() : undefined;

    if (!companyName) {
      errors.push(`Row ${rowNum}: Missing company name`);
      skipped++;
      continue;
    }

    if (!contactName) {
      errors.push(`Row ${rowNum}: Missing contact name`);
      skipped++;
      continue;
    }

    if (!contactEmail || !contactEmail.includes("@")) {
      errors.push(`Row ${rowNum}: Invalid or missing email`);
      skipped++;
      continue;
    }

    leads.push({
      companyName,
      companyWebsite: mapping.companyWebsite >= 0 ? row[mapping.companyWebsite]?.trim() || null : null,
      companyIndustry: mapping.companyIndustry >= 0 ? row[mapping.companyIndustry]?.trim() || null : null,
      companySize: mapping.companySize >= 0 ? row[mapping.companySize]?.trim() || null : null,
      contactName,
      contactTitle: mapping.contactTitle >= 0 ? row[mapping.contactTitle]?.trim() || null : null,
      contactEmail,
      contactPhone: mapping.contactPhone >= 0 ? row[mapping.contactPhone]?.trim() || null : null,
      contactLinkedIn: mapping.contactLinkedIn >= 0 ? row[mapping.contactLinkedIn]?.trim() || null : null,
      source: "google_sheets",
      status: "new",
      fitScore: null,
      priority: null,
      assignedSdrId: null,
      nextFollowUpAt: null,
      lastContactedAt: null,
    });
  }

  console.log(`[Sheets] Parsed ${leads.length} valid leads, skipped ${skipped}`);

  return { leads, skipped, errors };
}
