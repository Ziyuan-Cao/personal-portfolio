import { load } from "cheerio";
import type { RawContentItem } from "../../../ports/ContentSourceAdapter.js";

function asString(value:unknown):string|undefined{return typeof value==="string"?value:Array.isArray(value)&&typeof value[0]==="string"?value[0]:undefined;}
export class ArticleMetadataExtractor {
  extract(html:string,pageUrl:string):RawContentItem{
    const $=load(html);let jsonLd:Record<string,unknown>|undefined;
    $("script[type='application/ld+json']").each((_,element)=>{if(jsonLd)return;try{const parsed=JSON.parse($(element).text());const values=Array.isArray(parsed)?parsed:parsed["@graph"]??[parsed];jsonLd=(values as Record<string,unknown>[]).find(value=>String(value["@type"]??"").toLowerCase().includes("article"));}catch{/* malformed metadata */}});
    const metadata=(property:string,name?:string)=>$(`meta[property='${property}']`).attr("content")??(name?$(`meta[name='${name}']`).attr("content"):undefined);
    const image=jsonLd?.image;const jsonImage=typeof image==="object"&&image?asString((image as Record<string,unknown>).url):asString(image);
    return {url:metadata("og:url")??pageUrl,canonicalUrl:$("link[rel~='canonical']").attr("href"),title:asString(jsonLd?.headline)??metadata("og:title")??$("title").text(),subtitle:asString(jsonLd?.description)??metadata("og:description","description"),imageUrl:jsonImage??metadata("og:image")??$("article img[src]").first().attr("src")??$("img[src]").first().attr("src"),author:typeof jsonLd?.author==="object"&&jsonLd.author?asString((jsonLd.author as Record<string,unknown>).name):asString(jsonLd?.author),publishedAt:asString(jsonLd?.datePublished)??$("time[datetime]").first().attr("datetime"),extraction:{title:jsonLd?.headline?"json-ld":metadata("og:title")?"open-graph":"html",subtitle:jsonLd?.description?"json-ld":metadata("og:description")?"open-graph":"html",image:jsonImage?"json-ld":metadata("og:image")?"open-graph":"html"}};
  }
}
