import type { SourceRepository } from "../../ports/SourceRepository.js";
import type { Clock } from "../../ports/Clock.js";
import type { AppLogger } from "../../infrastructure/logger.js";
import type { CollectSourceUseCase } from "./CollectSourceUseCase.js";
export class CollectDueSourcesUseCase{constructor(private readonly sources:SourceRepository,private readonly collect:CollectSourceUseCase,private readonly clock:Clock,private readonly logger:AppLogger){}async execute(){for(const source of await this.sources.listDue(this.clock.now().toISOString())){try{await this.collect.execute(source.id);}catch(error){this.logger.warn({sourceId:source.id,error:error instanceof Error?error.message:String(error)},"Scheduled source collection failed");}}}}
