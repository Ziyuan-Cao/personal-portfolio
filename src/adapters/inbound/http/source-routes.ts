import type { FastifyInstance } from "fastify";
import type { NewSource } from "../../../domain/entities/Source.js";
import type { SourceRepository } from "../../../ports/SourceRepository.js";
import type { AddSourceUseCase } from "../../../application/use-cases/AddSourceUseCase.js";
import type { UpdateSourceUseCase } from "../../../application/use-cases/UpdateSourceUseCase.js";
import type { DeleteSourceUseCase } from "../../../application/use-cases/DeleteSourceUseCase.js";
import type { TestSourceUseCase } from "../../../application/use-cases/TestSourceUseCase.js";
import type { CollectSourceUseCase } from "../../../application/use-cases/CollectSourceUseCase.js";

interface SourceRoutes {sources:SourceRepository;add:AddSourceUseCase;update:UpdateSourceUseCase;remove:DeleteSourceUseCase;test:TestSourceUseCase;collect:CollectSourceUseCase;}
const sourceSchema={type:"object",required:["name","baseUrl","collectionUrl","adapterType","intervalMinutes","maxItemsPerRun","enabled"],additionalProperties:false,properties:{name:{type:"string",minLength:1,maxLength:120},baseUrl:{type:"string",format:"uri"},collectionUrl:{type:"string",format:"uri"},feedUrl:{anyOf:[{type:"string",format:"uri"},{type:"null"}]},adapterType:{enum:["AUTO","FEED","HTML","CUSTOM","BROWSER"]},adapterConfig:{type:"object",additionalProperties:{type:"string"}},intervalMinutes:{type:"integer",minimum:15,maximum:10080},maxItemsPerRun:{type:"integer",minimum:1,maximum:200},enabled:{type:"boolean"},testToken:{type:"string"}}} as const;
function input(body:Record<string,unknown>):NewSource{return {name:String(body.name),baseUrl:String(body.baseUrl),collectionUrl:String(body.collectionUrl),feedUrl:body.feedUrl?String(body.feedUrl):null,adapterType:body.adapterType as NewSource["adapterType"],adapterConfig:(body.adapterConfig??{}) as NewSource["adapterConfig"],intervalMinutes:Number(body.intervalMinutes),maxItemsPerRun:Number(body.maxItemsPerRun),enabled:Boolean(body.enabled)};}
export async function sourceRoutes(app:FastifyInstance,deps:SourceRoutes){
  app.get("/api/sources",async()=>({items:await deps.sources.list()}));
  app.get<{Params:{id:string}}>("/api/sources/:id",async(request,reply)=>{const source=await deps.sources.findById(request.params.id);if(!source)return reply.code(404).send({error:{code:"NOT_FOUND",message:"Source not found"}});return source;});
  app.post<{Body:Record<string,unknown>}>("/api/sources",{schema:{body:sourceSchema}},async(request,reply)=>reply.code(201).send(await deps.add.execute(input(request.body),request.body.testToken as string|undefined)));
  app.patch<{Params:{id:string};Body:Record<string,unknown>}>("/api/sources/:id",{schema:{body:{...sourceSchema,required:[]}}},async(request)=>deps.update.execute(request.params.id,request.body as Partial<NewSource>,request.body.testToken as string|undefined));
  app.delete<{Params:{id:string}}>("/api/sources/:id",async(request,reply)=>{await deps.remove.execute(request.params.id);return reply.code(204).send();});
  app.post<{Body:Record<string,unknown>}>("/api/sources/test",{schema:{body:{...sourceSchema,required:["name","baseUrl","collectionUrl","adapterType","intervalMinutes","maxItemsPerRun"]}}},async(request)=>deps.test.execute(input({...request.body,enabled:false})));
  app.post<{Params:{id:string}}>("/api/sources/:id/collect",async(request)=>deps.collect.execute(request.params.id));
}
