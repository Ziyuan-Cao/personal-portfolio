import type { ContentItem } from "../../domain/entities/ContentItem.js";
export interface ContentItemDto { id:string;title:string;subtitle:string|null;imageUrl:string|null;url:string;sourceName:string;publishedAt:string|null; }
export function toContentItemDto(item:ContentItem&{sourceName:string}):ContentItemDto{return {id:item.id,title:item.title,subtitle:item.subtitle,imageUrl:item.imageUrl,url:item.canonicalUrl,sourceName:item.sourceName,publishedAt:item.publishedAt};}
