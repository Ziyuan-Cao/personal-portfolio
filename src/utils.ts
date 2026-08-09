import { createHash } from "node:crypto";
import fs from "node:fs";

const trackingParameters = new Set([
  "fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src",
]);

export function canonicalizeUrl(rawUrl: string, base?: string): string {
  const url = new URL(rawUrl, base);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URLs must use HTTP or HTTPS");
  }
  url.hash = "";
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) {
    url.port = "";
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_") || trackingParameters.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString();
}

export function stableUid(sourceUrl: string, externalUid: string | null, canonicalUrl: string): string {
  const identity = externalUid?.trim()
    ? `${canonicalizeUrl(sourceUrl)}\u001f${externalUid.trim()}`
    : canonicalUrl;
  return createHash("sha256").update(identity).digest("hex");
}

export function loadSources(filename: string): string[] {
  const unique = new Set<string>();
  for (const rawLine of fs.readFileSync(filename, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    unique.add(canonicalizeUrl(line));
  }
  return [...unique];
}

export function sourceName(sourceUrl: string): string {
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  const parts = hostname.split(".");
  const name = parts.length > 1 ? parts[parts.length - 2]! : parts[0]!;
  const aliases: Record<string, string> = { unrealengine: "Unreal", nvidia: "NVIDIA", khronos: "Khronos" };
  return aliases[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}
