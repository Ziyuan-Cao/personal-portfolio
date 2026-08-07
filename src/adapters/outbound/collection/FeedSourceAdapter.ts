import { XMLParser } from "fast-xml-parser";
import { load } from "cheerio";
import type { ContentSourceAdapter, RawContentItem } from "../../../ports/ContentSourceAdapter.js";
import type { Source } from "../../../domain/entities/Source.js";
import type { HttpFetcher } from "../../../ports/HttpFetcher.js";

const array=<T>(value:T|T[]|undefined):T[]=>value===undefined?[]:Array.isArray(value)?value:[value];
const text=(value:unknown):string|undefined=>typeof value==="string"||typeof value==="number"?String(value):value&&typeof value==="object"?text((value as Record<string,unknown>)["#text"]):undefined;
const linkValue=(value:unknown):string|undefined=>{for(const entry of array(value)){if(typeof entry==="string")return entry;if(entry&&typeof entry==="object"){const record=entry as Record<string,unknown>;if((!record.rel||record.rel==="alternate")&&record.href)return String(record.href);}}return undefined;};
const imageValue=(entry:Record<string,unknown>):string|undefined=>{for(const key of ["media:content","media:thumbnail","enclosure","image"]){const value=array(entry[key])[0];if(typeof value==="string")return value;if(value&&typeof value==="object"){const url=(value as Record<string,unknown>).url;if(url)return String(url);}}return undefined;};

export class FeedSourceAdapter implements ContentSourceAdapter {
  readonly name="feed";private readonly parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:"",textNodeName:"#text",removeNSPrefix:false});
  constructor(private readonly http:HttpFetcher){}
  supports(source:Source){return source.adapterType==="AUTO"||source.adapterType==="FEED";}
  async collect(source:Source,context:{maxItems:number;captureValidators?:(validators:{etag:string|null;lastModified:string|null})=>void}):Promise<RawContentItem[]>{
    let target=source.feedUrl??source.collectionUrl;let response=await this.http.get(target,{etag:source.etag,lastModified:source.lastModified});
    context.captureValidators?.({etag:response.etag,lastModified:response.lastModified});
    if(response.notModified)return [];
    if(response.contentType.includes("html")||/^\s*<!doctype html|^\s*<html/i.test(response.body)){
      const $=load(response.body);const discovered=$("link[rel~='alternate'][type='application/rss+xml'],link[rel~='alternate'][type='application/atom+xml'],link[rel~='alternate'][type='application/feed+json']").first().attr("href");
      if(!discovered)throw new Error("No RSS, Atom, or JSON Feed was discovered");target=new URL(discovered,response.url).toString();response=await this.http.get(target);context.captureValidators?.({etag:response.etag,lastModified:response.lastModified});
    }
    if(response.contentType.includes("json")||/^\s*\{/.test(response.body)){
      const feed=JSON.parse(response.body) as Record<string,unknown>;return array(feed.items as Record<string,unknown>[]).slice(0,context.maxItems).map(entry=>({externalUid:text(entry.id),url:text(entry.url)??text(entry.external_url)??"",title:text(entry.title)??"",subtitle:text(entry.summary)??text(entry.content_text)??text(entry.content_html),imageUrl:text(entry.image)??text(entry.banner_image),author:text((array(entry.authors as Record<string,unknown>[])[0]??{}).name),publishedAt:text(entry.date_published)??text(entry.date_modified)}));
    }
    const parsed=this.parser.parse(response.body) as Record<string,unknown>;const rss=(parsed.rss as Record<string,unknown>|undefined)?.channel as Record<string,unknown>|undefined;
    const root=(parsed.feed as Record<string,unknown>|undefined);const entries=rss?array(rss.item as Record<string,unknown>[]):array(root?.entry as Record<string,unknown>[]);
    if(!entries.length)throw new Error("Feed did not contain any entries");
    return entries.slice(0,context.maxItems).map(entry=>({externalUid:text(entry.guid)??text(entry.id),url:linkValue(entry.link)??text(entry.url)??"",title:text(entry.title)??"",subtitle:text(entry.description)??text(entry.summary)??text(entry.content),imageUrl:imageValue(entry),author:text(entry.author)??text(entry["dc:creator"]),publishedAt:text(entry.pubDate)??text(entry.published)??text(entry.updated)}));
  }
}
