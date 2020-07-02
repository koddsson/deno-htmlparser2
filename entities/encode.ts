import { MapType } from "./decode.ts";

import htmlMap from "./maps/entities.ts";
import xmlMap from "./maps/xml.ts";

const inverseXML = getInverseObj(xmlMap);
const xmlReplacer = getInverseReplacer(inverseXML);

export const encodeXML = getInverse(inverseXML, xmlReplacer);

const inverseHTML = getInverseObj(htmlMap);
const htmlReplacer = getInverseReplacer(inverseHTML);

export const encodeHTML = getInverse(inverseHTML, htmlReplacer);

function getInverseObj(obj: MapType): MapType {
  return Object.keys(obj)
    .sort()
    .reduce((inverse: MapType, name: string) => {
      inverse[obj[name]] = `&${name};`;
      return inverse;
    }, {});
}

function getInverseReplacer(inverse: MapType): RegExp {
  const single: string[] = [];
  const multiple: string[] = [];

  for (const k of Object.keys(inverse)) {
    if (k.length === 1) {
      // Add value to single array
      single.push(`\\${k}`);
    } else {
      // Add value to multiple array
      multiple.push(k);
    }
  }

  // Add ranges to single characters.
  single.sort();
  for (let start = 0; start < single.length - 1; start++) {
    // Find the end of a run of characters
    let end = start;
    while (
      end < single.length - 1 &&
      single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)
    ) {
      end += 1;
    }

    const count = 1 + end - start;

    // We want to replace at least three characters
    if (count < 3) continue;

    single.splice(start, count, `${single[start]}-${single[end]}`);
  }

  multiple.unshift(`[${single.join("")}]`);

  return new RegExp(multiple.join("|"), "g");
}

const reNonASCII =
  /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;

function singleCharReplacer(c: string): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return `&#x${c.codePointAt(0)!.toString(16).toUpperCase()};`;
}

function getInverse(inverse: MapType, re: RegExp) {
  return (data: string) =>
    data
      .replace(re, (name) => inverse[name])
      .replace(reNonASCII, singleCharReplacer);
}

const reXmlChars = getInverseReplacer(inverseXML);

export function escape(data: string) {
  return data
    .replace(reXmlChars, singleCharReplacer)
    .replace(reNonASCII, singleCharReplacer);
}
