import type { SourceRepository } from "../../ports/SourceRepository.js";
import type { ContentRepository } from "../../ports/ContentRepository.js";
import type { CollectionRunRepository } from "../../ports/CollectionRunRepository.js";
import type { Clock } from "../../ports/Clock.js";
import type { IdGenerator } from "../../ports/IdGenerator.js";
import type { CollectionRun } from "../../domain/entities/CollectionRun.js";
import type { ContentItem } from "../../domain/entities/ContentItem.js";
import { AdapterRegistry } from "../../adapters/outbound/collection/AdapterRegistry.js";
import { MetadataNormalizer } from "../../adapters/outbound/metadata/MetadataNormalizer.js";
import { UrlCanonicalizer } from "../../adapters/outbound/metadata/UrlCanonicalizer.js";
import { ContentIdentityService } from "../../domain/services/ContentIdentityService.js";

export class CollectSourceUseCase {
  private readonly active=new Set<string>();
  constructor(private readonly sources:SourceRepository,private readonly content:ContentRepository,private readonly runs:CollectionRunRepository,private readonly registry:AdapterRegistry,private readonly normalizer:MetadataNormalizer,private readonly canonicalizer:UrlCanonicalizer,private readonly identity:ContentIdentityService,private readonly ids:IdGenerator,private readonly clock:Clock,private readonly failureThreshold:number){}
  async execute(sourceId:string):Promise<CollectionRun>{
    if(this.active.has(sourceId))throw new Error("This source is already being collected");const source=await this.sources.findById(sourceId);if(!source)throw new Error("Source not found");this.active.add(sourceId);
    const startedAt=this.clock.now().toISOString();let run:CollectionRun={id:this.ids.generate(),sourceId,startedAt,completedAt:null,status:"RUNNING",fetchedCount:0,insertedCount:0,updatedCount:0,duplicateCount:0,errorCount:0,errorMessage:null};await this.runs.create(run);
    try{
      let rawItems=null;let lastError:unknown;let validators:{etag:string|null;lastModified:string|null}={etag:source.etag,lastModified:source.lastModified};
      for(const adapter of this.registry.resolve(source)){try{rawItems=await adapter.collect(source,{maxItems:source.maxItemsPerRun,captureValidators:value=>{validators={etag:value.etag??validators.etag,lastModified:value.lastModified??validators.lastModified};}});break;}catch(error){lastError=error;if(source.adapterType!=="AUTO")throw error;}}
      if(!rawItems)throw lastError instanceof Error?lastError:new Error("No adapter could collect this source");run.fetchedCount=rawItems.length;
      await this.content.withTransaction(async()=>{for(const raw of rawItems!){try{const item=this.normalizer.normalize(raw,source.collectionUrl);const canonical=this.canonicalizer.canonicalize(item.canonicalUrl??item.url,source.collectionUrl);const seen=this.clock.now().toISOString();const contentItem:ContentItem={id:this.ids.generate(),sourceId,externalUid:item.externalUid?.trim()||null,rawUrl:item.url,canonicalUrl:canonical.value,canonicalUrlHash:canonical.hash,title:item.title,subtitle:item.subtitle??null,imageUrl:item.imageUrl??null,author:item.author??null,publishedAt:item.publishedAt??null,firstSeenAt:seen,lastSeenAt:seen,contentHash:this.identity.contentHash([item.title,item.subtitle,item.imageUrl,item.author,item.publishedAt]),status:"ACTIVE"};const result=await this.content.upsert(contentItem);if(result.action==="inserted")run.insertedCount++;else if(result.action==="updated")run.updatedCount++;else run.duplicateCount++;}catch{run.errorCount++;}}});
      const completed=this.clock.now();run={...run,completedAt:completed.toISOString(),status:rawItems.length===0?"NOT_MODIFIED":"SUCCESS"};await this.runs.update(run);await this.sources.update({...source,etag:validators.etag,lastModified:validators.lastModified,lastCollectedAt:completed.toISOString(),nextCollectionAt:new Date(completed.valueOf()+source.intervalMinutes*60_000).toISOString(),failureCount:0,status:source.enabled?"ACTIVE":"PAUSED",updatedAt:completed.toISOString()});return run;
    }catch(error){const completed=this.clock.now();const failures=source.failureCount+1;run={...run,completedAt:completed.toISOString(),status:"FAILED",errorCount:Math.max(run.errorCount,1),errorMessage:error instanceof Error?error.message:"Collection failed"};await this.runs.update(run);const paused=failures>=this.failureThreshold;const backoff=Math.min(source.intervalMinutes*2**Math.min(failures,6),10080);await this.sources.update({...source,enabled:paused?false:source.enabled,status:paused?"PAUSED":"FAILING",failureCount:failures,nextCollectionAt:new Date(completed.valueOf()+backoff*60_000).toISOString(),updatedAt:completed.toISOString()});throw Object.assign(error instanceof Error?error:new Error("Collection failed"),{run});}
    finally{this.active.delete(sourceId);}
  }
}
