import type { FastifyInstance } from "fastify";
import type { ContentRepository } from "../../../ports/ContentRepository.js";
import type { ListContentUseCase } from "../../../application/use-cases/ListContentUseCase.js";
import { toContentItemDto } from "../../../application/dto/ContentItemDto.js";
export async function contentRoutes(app:FastifyInstance,deps:{content:ContentRepository;list:ListContentUseCase}){
  app.get<{Querystring:{sourceId?:string;search?:string;from?:string;to?:string;cursor?:string;limit?:string;sort?:string}}>("/api/content",async(request)=>deps.list.execute({sourceId:request.query.sourceId,search:request.query.search?.trim(),from:request.query.from,to:request.query.to,cursor:request.query.cursor,limit:Math.min(Math.max(Number(request.query.limit)||12,1),50),sort:request.query.sort==="oldest"?"oldest":"newest"}));
  app.get<{Params:{id:string}}>("/api/content/:id",async(request,reply)=>{const item=await deps.content.findById(request.params.id);if(!item)return reply.code(404).send({error:{code:"NOT_FOUND",message:"Content item not found"}});return toContentItemDto(item);});
  app.delete<{Params:{id:string}}>("/api/content/:id",async(request,reply)=>{if(!await deps.content.delete(request.params.id))return reply.code(404).send({error:{code:"NOT_FOUND",message:"Content item not found"}});return reply.code(204).send();});
}
