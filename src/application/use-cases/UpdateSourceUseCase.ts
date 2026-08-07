import type { NewSource, Source } from "../../domain/entities/Source.js";
import { validateSource } from "../../domain/entities/Source.js";
import type { SourceRepository } from "../../ports/SourceRepository.js";
import type { Clock } from "../../ports/Clock.js";
import type { TestSourceUseCase } from "./TestSourceUseCase.js";
export class UpdateSourceUseCase {
  constructor(private readonly sources:SourceRepository,private readonly clock:Clock,private readonly tester:TestSourceUseCase){}
  async execute(id:string,patch:Partial<NewSource>,testToken?:string):Promise<Source>{const existing=await this.sources.findById(id);if(!existing)throw new Error("Source not found");const candidate:NewSource={name:patch.name??existing.name,baseUrl:patch.baseUrl??existing.baseUrl,collectionUrl:patch.collectionUrl??existing.collectionUrl,feedUrl:patch.feedUrl===undefined?existing.feedUrl:patch.feedUrl,adapterType:patch.adapterType??existing.adapterType,adapterConfig:patch.adapterConfig??existing.adapterConfig,intervalMinutes:patch.intervalMinutes??existing.intervalMinutes,maxItemsPerRun:patch.maxItemsPerRun??existing.maxItemsPerRun,enabled:patch.enabled??existing.enabled};const input=validateSource(candidate);const collectionChanged=["baseUrl","collectionUrl","feedUrl","adapterType","adapterConfig"].some(key=>key in patch);if(input.enabled&&(!existing.enabled||collectionChanged)&&!this.tester.consume(testToken,input))throw new Error("Test Source must return a valid preview before this source can be enabled");return this.sources.update({...existing,...input,status:input.enabled?"ACTIVE":"PAUSED",nextCollectionAt:!existing.enabled&&input.enabled?this.clock.now().toISOString():existing.nextCollectionAt,updatedAt:this.clock.now().toISOString()});}
}
