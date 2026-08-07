import type { SourceRepository } from "../../ports/SourceRepository.js";
export class DeleteSourceUseCase{constructor(private readonly sources:SourceRepository){}async execute(id:string){if(!await this.sources.delete(id))throw new Error("Source not found");}}
