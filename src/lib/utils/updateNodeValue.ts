// src/lib/utils/updateNodeValue.ts
import { FileFormat } from "../../enums/file.enum";
import { contentToJson, jsonToContent } from "./jsonAdapter";

export type JsonPath = Array<string | number>;

function isObjectLike(v: unknown) {
    return typeof v === "object" && v !== null;
}

function shallowClone(v: any): any {
    if (Array.isArray(v)) return [...v];
    if (isObjectLike(v)) return { ...v };
    return v;
}

function ensureContainer(nextKey: string | number) {
    return typeof nextKey === "number" ? [] : {};
}

function setDeep(root: any, path: JsonPath, value: any) {
    const clone = shallowClone(root);
    if (path.length === 0) return value;

    let cur: any = clone;

    for (let i = 0; i < path.length; i++) {
        const seg = path[i] as any;
        const isLast = i === path.length - 1;

        if (isLast) {
            cur[seg] = value;
        } else {
            const nextSeg = path[i + 1] as any;
            const existing = cur[seg];

            if (Array.isArray(existing)) {
                cur[seg] = [...existing];
                cur = cur[seg];
            } else if (isObjectLike(existing)) {
                cur[seg] = { ...existing };
                cur = cur[seg];
            } else {
                cur[seg] = ensureContainer(nextSeg);
                cur = cur[seg];
            }
        }
    }

    return clone;
}

export function coerceByType(input: string, type: string) {
  const raw = input?.toString?.() ?? "";

  switch (type) {
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    case "boolean": {
      const lc = raw.trim().toLowerCase();
      if (lc === "true") return true;
      if (lc === "false") return false;
      return raw;
    }
    case "null": {
      const lc = raw.trim().toLowerCase();
      if (lc === "" || lc === "null") return null;
      return raw;
    }
    default:
      return raw;
  }
}

export async function updateNodeContent(
  currentContents: string,
  format: FileFormat,
  path: JsonPath,
  nextValue: any
): Promise<string> {
  const jsonObj = (await contentToJson(currentContents, format)) as any;
  const updated = setDeep(jsonObj, path, nextValue);
  const jsonString = JSON.stringify(updated, null, 2);
  const result =
    format === FileFormat.JSON ? jsonString : await jsonToContent(jsonString, format);
  return result;
}