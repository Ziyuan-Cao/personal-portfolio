import dns from "node:dns/promises";
import net from "node:net";
import type { FetchOptions, FetchResponse, HttpFetcher } from "../../../ports/HttpFetcher.js";

interface SafeHttpConfig { timeoutMs: number; maxBytes: number; userAgent: string; maxRedirects: number; }

function isPrivateIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const [a=0,b=0] = address.split(".").map(Number);
    return a===10 || a===127 || a===0 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || (a===100&&b>=64&&b<=127) || a>=224;
  }
  const normalized=address.toLowerCase();
  return normalized==="::1" || normalized==="::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
}

async function validateTarget(value: string): Promise<URL> {
  const url=new URL(value);
  if(url.protocol!=="http:"&&url.protocol!=="https:")throw new Error("Only HTTP and HTTPS targets are allowed");
  if(url.username||url.password)throw new Error("URLs containing credentials are not allowed");
  const hostname=url.hostname.replace(/^\[|\]$/g,"").toLowerCase();
  if(hostname==="localhost"||hostname.endsWith(".localhost")||hostname.endsWith(".local"))throw new Error("Local network targets are not allowed");
  const addresses=net.isIP(hostname)?[{address:hostname}]:await dns.lookup(hostname,{all:true});
  if(!addresses.length||addresses.some(({address})=>isPrivateIp(address)))throw new Error("Private, loopback, and link-local targets are not allowed");
  return url;
}

function retryDelay(response: Response, attempt:number):number{
  const header=response.headers.get("retry-after");
  if(header){const seconds=Number(header);if(Number.isFinite(seconds))return Math.min(seconds*1000,5000);const date=Date.parse(header);if(Number.isFinite(date))return Math.min(Math.max(date-Date.now(),0),5000);}
  return 250*2**attempt;
}

export class SafeHttpFetcher implements HttpFetcher {
  constructor(private readonly config:SafeHttpConfig){}
  async get(rawUrl:string,options:FetchOptions={}):Promise<FetchResponse>{
    let current=rawUrl;
    for(let redirect=0;redirect<=this.config.maxRedirects;redirect++){
      const url=await validateTarget(current);
      const headers:Record<string,string>={"user-agent":this.config.userAgent,"accept":"application/rss+xml, application/atom+xml, application/feed+json, application/json, text/html, application/xml, text/xml;q=0.9"};
      if(options.etag)headers["if-none-match"]=options.etag;
      if(options.lastModified)headers["if-modified-since"]=options.lastModified;
      let response:Response|undefined;
      for(let attempt=0;attempt<3;attempt++){
        const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),this.config.timeoutMs);
        const abort=()=>controller.abort(); options.signal?.addEventListener("abort",abort,{once:true});
        try { response=await fetch(url,{headers,redirect:"manual",signal:controller.signal}); }
        catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,250*2**attempt));continue;}
        finally{clearTimeout(timer);options.signal?.removeEventListener("abort",abort);}
        if(!response||![429,502,503,504].includes(response.status)||attempt===2)break;
        const retryMs=retryDelay(response,attempt);
        await new Promise(resolve=>setTimeout(resolve,retryMs));
      }
      if(!response)throw new Error("HTTP request failed");
      if([301,302,303,307,308].includes(response.status)){
        const location=response.headers.get("location");if(!location)throw new Error("Redirect response did not include a location");current=new URL(location,url).toString();continue;
      }
      if(response.status===304)return {status:304,url:url.toString(),contentType:"",body:"",etag:response.headers.get("etag"),lastModified:response.headers.get("last-modified"),notModified:true};
      if(!response.ok)throw new Error(`Remote server returned HTTP ${response.status}`);
      const contentType=(response.headers.get("content-type")??"").split(";",1)[0]!.trim().toLowerCase();
      if(options.acceptedContentTypes?.length&&!options.acceptedContentTypes.some(type=>contentType===type||contentType.endsWith(`+${type.split("/")[1]}`)))throw new Error(`Unsupported content type: ${contentType||"unknown"}`);
      const reader=response.body?.getReader();if(!reader)throw new Error("Response did not contain a body");
      const chunks:Uint8Array[]=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>this.config.maxBytes){await reader.cancel();throw new Error("Response exceeded the configured size limit");}chunks.push(value);}
      const body=new TextDecoder().decode(Buffer.concat(chunks));
      return {status:response.status,url:response.url||url.toString(),contentType,body,etag:response.headers.get("etag"),lastModified:response.headers.get("last-modified"),notModified:false};
    }
    throw new Error("Too many redirects");
  }
}
