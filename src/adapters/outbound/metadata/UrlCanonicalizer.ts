import { load } from "cheerio";
import { CanonicalUrl } from "../../../domain/value-objects/CanonicalUrl.js";

export class UrlCanonicalizer {
  canonicalize(rawUrl:string,base?:string,html?:string):CanonicalUrl{
    let candidate=rawUrl;
    if(html){const $=load(html);const declared=$("link[rel~='canonical']").first().attr("href");if(declared){try{const resolved=new URL(declared,base??rawUrl);const original=new URL(rawUrl,base);if(resolved.hostname===original.hostname)candidate=resolved.toString();}catch{/* ignore invalid declarations */}}}
    return new CanonicalUrl(candidate,base);
  }
}
