import { load, type CheerioAPI, type Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { ContentSourceAdapter, RawContentItem } from "../../../ports/ContentSourceAdapter.js";
import type { Source } from "../../../domain/entities/Source.js";
import type { HttpFetcher } from "../../../ports/HttpFetcher.js";

function first($:CheerioAPI,node:Cheerio<AnyNode>,selector:string|undefined,fallback:string):Cheerio<AnyNode>{return node.find(selector||fallback).first();}
export class GenericHtmlSourceAdapter implements ContentSourceAdapter {
  readonly name="html";constructor(private readonly http:HttpFetcher){}
  supports(source:Source){return source.adapterType==="AUTO"||source.adapterType==="HTML";}
  async collect(source:Source,context:{maxItems:number;captureValidators?:(validators:{etag:string|null;lastModified:string|null})=>void}):Promise<RawContentItem[]>{
    const response=await this.http.get(source.collectionUrl,{etag:source.etag,lastModified:source.lastModified,acceptedContentTypes:["text/html"]});context.captureValidators?.({etag:response.etag,lastModified:response.lastModified});if(response.notModified)return [];
    const $=load(response.body);const config=source.adapterConfig;const nodes=$(config.itemSelector||"article, .news-card, .post, .entry").slice(0,context.maxItems);const items:RawContentItem[]=[];
    nodes.each((_,element)=>{const node=$(element);const link=first($,node,config.linkSelector,"a[href]");const url=link.attr("href");const title=first($,node,config.titleSelector,"h1,h2,h3,.title").text().trim()||link.text().trim();if(!url||!title)return;const image=first($,node,config.imageSelector,"img");items.push({url:new URL(url,response.url).toString(),title,subtitle:first($,node,config.subtitleSelector,"p,.summary,.description").text().trim(),imageUrl:image.attr("src")??image.attr("data-src"),publishedAt:first($,node,config.dateSelector,"time").attr("datetime")??first($,node,config.dateSelector,"time").text().trim(),extraction:{title:"selector",subtitle:"selector",image:"selector"}});});
    if(!items.length)throw new Error("HTML selectors did not produce any valid items");return items;
  }
}
