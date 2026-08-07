import type { NewSource, Source } from "../../domain/entities/Source.js";
import { validateSource } from "../../domain/entities/Source.js";
import type { SourceRepository } from "../../ports/SourceRepository.js";
import type { IdGenerator } from "../../ports/IdGenerator.js";
import type { Clock } from "../../ports/Clock.js";
import type { TestSourceUseCase } from "./TestSourceUseCase.js";
export class AddSourceUseCase {
  constructor(private readonly sources:SourceRepository,private readonly ids:IdGenerator,private readonly clock:Clock,private readonly tester:TestSourceUseCase){}
  async execute(raw:NewSource,testToken?:string):Promise<Source>{const input=validateSource(raw);if(input.enabled&&!this.tester.consume(testToken,input))throw new Error("Test Source must return a valid preview before an active source can be saved");const now=this.clock.now().toISOString();return this.sources.create({...input,id:this.ids.generate(),etag:null,lastModified:null,lastCollectedAt:null,nextCollectionAt:now,failureCount:0,status:input.enabled?"ACTIVE":"PAUSED",createdAt:now,updatedAt:now});}
}
