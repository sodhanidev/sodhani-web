import fs from "node:fs";
import path from "node:path";

import { parseCsvRows } from "./csv";
import { cleanDisplayName, normalizeWhitespace } from "./format";
import type { IndustryDepth, IndustryNode } from "./types";

type IndustryData = {
  nodes: Map<string, IndustryNode>;
  roots: IndustryNode[];
  leaves: IndustryNode[];
};

const INDUSTRY_FILE = path.join(process.cwd(), "category_wise", "industry_codes.csv");
let cache: IndustryData | null = null;

type IndustryRow = {
  sectorCode: string;
  sectorName: string;
  groupCode: string;
  groupName: string;
  industryCode: string;
  industryName: string;
  leafCode: string;
  leafName: string;
  description: string;
};

function readIndustryRows(): IndustryRow[] {
  const rows = parseCsvRows(fs.readFileSync(INDUSTRY_FILE, "utf8"));
  return rows
    .filter((row) => row[0] !== "0")
    .map((row) => {
      const sectorRaw = row[1] ?? "";
      const groupFromSector = sectorRaw.match(/\s+(IN\d{4})\s*$/u)?.[1] ?? "";
      const groupCode = normalizeWhitespace(row[2] || groupFromSector);

      return {
        sectorCode: normalizeWhitespace(row[0] ?? ""),
        sectorName: cleanDisplayName(sectorRaw),
        groupCode,
        groupName: cleanDisplayName(row[3] ?? ""),
        industryCode: normalizeWhitespace(row[4] ?? ""),
        industryName: cleanDisplayName(row[5] ?? ""),
        leafCode: normalizeWhitespace(row[6] ?? ""),
        leafName: cleanDisplayName(row[7] ?? ""),
        description: normalizeWhitespace(row[8] ?? "")
      };
    })
    .filter((row) =>
      Boolean(row.sectorCode && row.groupCode && row.industryCode && row.leafCode)
    );
}

function ensureNode(
  nodes: Map<string, IndustryNode>,
  code: string,
  name: string,
  depth: IndustryDepth,
  pathParts: string[],
  names: string[],
  description?: string
) {
  if (!nodes.has(code)) {
    nodes.set(code, {
      code,
      name,
      depth,
      path: pathParts,
      names,
      description,
      children: [],
      companyCount: 0
    });
  }

  const node = nodes.get(code);
  if (node && description && !node.description) {
    node.description = description;
  }
}

function linkChild(nodes: Map<string, IndustryNode>, parentCode: string, childCode: string) {
  const parent = nodes.get(parentCode);
  if (parent && !parent.children.includes(childCode)) {
    parent.children.push(childCode);
  }
}

export function getIndustryData(): IndustryData {
  if (cache) {
    return cache;
  }

  const nodes = new Map<string, IndustryNode>();
  const rows = readIndustryRows();

  rows.forEach((row) => {
    const pathParts = [
      row.sectorCode,
      row.groupCode,
      row.industryCode,
      row.leafCode
    ];
    const names = [row.sectorName, row.groupName, row.industryName, row.leafName];

    ensureNode(nodes, row.sectorCode, row.sectorName, 1, pathParts.slice(0, 1), names.slice(0, 1));
    ensureNode(nodes, row.groupCode, row.groupName, 2, pathParts.slice(0, 2), names.slice(0, 2));
    ensureNode(nodes, row.industryCode, row.industryName, 3, pathParts.slice(0, 3), names.slice(0, 3));
    ensureNode(nodes, row.leafCode, row.leafName, 4, pathParts, names, row.description);

    linkChild(nodes, row.sectorCode, row.groupCode);
    linkChild(nodes, row.groupCode, row.industryCode);
    linkChild(nodes, row.industryCode, row.leafCode);
  });

  cache = {
    nodes,
    roots: [...nodes.values()].filter((node) => node.depth === 1),
    leaves: [...nodes.values()].filter((node) => node.depth === 4)
  };

  return cache;
}

export function getNodeByCode(code: string): IndustryNode | undefined {
  return getIndustryData().nodes.get(code);
}

export function getNodeByPath(pathParts: string[]): IndustryNode | undefined {
  if (pathParts.length === 0) {
    return undefined;
  }
  return getNodeByCode(pathParts[pathParts.length - 1]);
}
