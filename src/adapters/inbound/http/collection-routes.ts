import type { FastifyInstance } from "fastify";
import type { CollectionRunRepository } from "../../../ports/CollectionRunRepository.js";
export async function collectionRoutes(app:FastifyInstance,deps:{runs:CollectionRunRepository}){
  app.get<{Querystring:{limit?:string}}>("/api/collection-runs",async(request)=>({items:await deps.runs.list(Math.min(Math.max(Number(request.query.limit)||30,1),100))}));
  app.get<{Params:{id:string}}>("/api/collection-runs/:id",async(request,reply)=>{const run=await deps.runs.findById(request.params.id);if(!run)return reply.code(404).send({error:{code:"NOT_FOUND",message:"Collection run not found"}});return run;});
}
