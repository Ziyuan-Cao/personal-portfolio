import { load } from "cheerio";
import type { RawContentItem } from "../../../ports/ContentSourceAdapter.js";

function plain(value:string|undefined|null,max:number):string|null{
  if(!value)return null;
  const clean=load(`<body>${value}</body>`)("body").text().replace(/\s+/g," ").trim();
  if(!clean)return null;return clean.length>max?`${clean.slice(0,max-1).trimEnd()}…`:clean;
}
function date(value:string|undefined|null):string|null{if(!value)return null;const parsed=new Date(value);return Number.isNaN(parsed.valueOf())?null:parsed.toISOString();}
function optionalUrl(value:string|undefined|null,base:string):string|null{if(!value)return null;try{const url=new URL(value,base);return ["http:","https:"].includes(url.protocol)?url.toString():null;}catch{return null;}}

export class MetadataNormalizer {
  normalize(item:RawContentItem,baseUrl:string):RawContentItem{
    const title=plain(item.title,300);if(!title)throw new Error("Collected item is missing a title");
    return {...item,title,subtitle:plain(item.subtitle,1000),url:new URL(item.url,baseUrl).toString(),canonicalUrl:optionalUrl(item.canonicalUrl,baseUrl),imageUrl:optionalUrl(item.imageUrl,baseUrl),author:plain(item.author,160),publishedAt:date(item.publishedAt)};
  }
}
