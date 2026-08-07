import type { ContentSourceAdapter } from "../../../ports/ContentSourceAdapter.js";
import type { Source } from "../../../domain/entities/Source.js";
export class AdapterRegistry {
  constructor(private readonly adapters:ContentSourceAdapter[]){}
  resolve(source:Source):ContentSourceAdapter[]{const matches=this.adapters.filter(adapter=>adapter.supports(source));if(!matches.length)throw new Error(`No adapter supports ${source.adapterType}`);return matches;}
}
