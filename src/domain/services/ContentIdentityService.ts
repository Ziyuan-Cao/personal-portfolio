import { createHash } from "node:crypto";
import type { ContentIdentity } from "../value-objects/ContentIdentity.js";

export class ContentIdentityService {
  create(externalUid: string | null | undefined, canonicalUrlHash: string): ContentIdentity {
    return { externalUid: externalUid?.trim() || null, canonicalUrlHash };
  }

  contentHash(fields: Array<string | null | undefined>): string {
    return createHash("sha256").update(fields.map((field) => field ?? "").join("\u001f")).digest("hex");
  }
}
