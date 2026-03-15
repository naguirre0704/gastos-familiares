import { google } from "googleapis";
import { parseCorreoBancoChile, ParsedGasto } from "./parser";

export interface GmailMessage {
  id: string;
  parsed: ParsedGasto;
}

function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth });
}

function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}

function extractBody(payload: GmailPart): string {
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

export async function syncGmailGastos(
  accessToken: string,
  afterDate?: string
): Promise<GmailMessage[]> {
  const gmail = getGmailClient(accessToken);

  let query = 'subject:"Cargo en Cuenta"';
  if (afterDate) {
    // afterDate in format DD/MM/YYYY → convert to YYYY/MM/DD for Gmail query
    const parts = afterDate.split("/");
    if (parts.length === 3) {
      query += ` after:${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } else {
    // default: last 30 days
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    query += ` after:${y}/${m}/${day}`;
  }

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 100,
  });

  const messages = listRes.data.messages || [];
  const results: GmailMessage[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;
    try {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const body = extractBody(detail.data.payload);
      const parsed = parseCorreoBancoChile(body);
      if (parsed) {
        results.push({ id: msg.id, parsed });
      }
    } catch {
      // skip unreadable messages
    }
  }

  return results;
}
