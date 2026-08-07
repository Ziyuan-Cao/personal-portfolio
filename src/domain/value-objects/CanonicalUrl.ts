import { createHash } from "node:crypto";

const TRACKING_PARAMETERS = new Set(["fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src"]);

export class CanonicalUrl {
  readonly value: string;
  readonly hash: string;

  constructor(raw: string, base?: string) {
    const url = new URL(raw, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Content URL must use HTTP or HTTPS");
    url.hash = "";
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) url.port = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMETERS.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    this.value = url.toString();
    this.hash = createHash("sha256").update(this.value).digest("hex");
  }
}
