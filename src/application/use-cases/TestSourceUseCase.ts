import { createHash, randomBytes } from "node:crypto";
import type { NewSource, Source } from "../../domain/entities/Source.js";
import { validateSource } from "../../domain/entities/Source.js";
import type { RawContentItem } from "../../ports/ContentSourceAdapter.js";
import type { Clock } from "../../ports/Clock.js";
import type { IdGenerator } from "../../ports/IdGenerator.js";
import { AdapterRegistry } from "../../adapters/outbound/collection/AdapterRegistry.js";
import { MetadataNormalizer } from "../../adapters/outbound/metadata/MetadataNormalizer.js";

export class TestSourceUseCase {
  private readonly tokens=new Map<string,{fingerprint:string;expires:number}>();
  constructor(private readonly registry:AdapterRegistry,private readonly normalizer:MetadataNormalizer,private readonly ids:IdGenerator,private readonly clock:Clock){}
  fingerprint(input:NewSource):string{return createHash("sha256").update(JSON.stringify({...input,enabled:undefined})).digest("hex");}
  async execute(raw:NewSource):Promise<{items:RawContentItem[];adapter:string;testToken:string}>{
    const input=validateSource({...raw,enabled:false});const now=this.clock.now().toISOString();const source:Source={...input,id:this.ids.generate(),etag:null,lastModified:null,lastCollectedAt:null,nextCollectionAt:now,failureCount:0,status:"ACTIVE",createdAt:now,updatedAt:now};
    let lastError:unknown;
    for(const adapter of this.registry.resolve(source)){try{const items=(await adapter.collect(source,{maxItems:Math.min(input.maxItemsPerRun,5)})).map(item=>this.normalizer.normalize(item,source.collectionUrl)).filter(item=>item.title&&item.url);if(items.length){const testToken=randomBytes(24).toString("base64url");this.tokens.set(testToken,{fingerprint:this.fingerprint(input),expires:Date.now()+10*60_000});return {items,adapter:adapter.name,testToken};}}catch(error){lastError=error;if(source.adapterType!=="AUTO")throw error;}}
    throw lastError instanceof Error?lastError:new Error("Source test returned no valid items");
  }
  consume(token:string|undefined,input:NewSource):boolean{if(!token)return false;const match=this.tokens.get(token);this.tokens.delete(token);return Boolean(match&&match.expires>=Date.now()&&match.fingerprint===this.fingerprint({...input,enabled:false}));}
}
