import type { ContentQuery, ContentRepository } from "../../ports/ContentRepository.js";
import { toContentItemDto } from "../dto/ContentItemDto.js";
export class ListContentUseCase{constructor(private readonly content:ContentRepository){}async execute(query:ContentQuery){const page=await this.content.list(query);return {items:page.items.map(toContentItemDto),nextCursor:page.nextCursor};}}
