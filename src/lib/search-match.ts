import type { SearchItem } from "@/lib/data/search-index";

export type RankedSearchItem = SearchItem & {
  score: number;
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .trim();
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/gu, "");
}

function maxFuzzyDistance(length: number) {
  if (length <= 4) {
    return 1;
  }

  if (length <= 8) {
    return 2;
  }

  return 3;
}

function damerauLevenshteinDistance(a: string, b: string, limit: number) {
  const rows = a.length + 1;
  const columns = b.length + 1;
  const distance = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    distance[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    distance[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    let rowBest = Number.POSITIVE_INFINITY;

    for (let column = 1; column < columns; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      let nextDistance = Math.min(
        distance[row - 1][column] + 1,
        distance[row][column - 1] + 1,
        distance[row - 1][column - 1] + cost
      );

      if (
        row > 1 &&
        column > 1 &&
        a[row - 1] === b[column - 2] &&
        a[row - 2] === b[column - 1]
      ) {
        nextDistance = Math.min(nextDistance, distance[row - 2][column - 2] + 1);
      }

      distance[row][column] = nextDistance;
      rowBest = Math.min(rowBest, nextDistance);
    }

    if (rowBest > limit) {
      return rowBest;
    }
  }

  return distance[a.length][b.length];
}

function hasSingleAdjacentTransposition(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  const differences: number[] = [];

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      differences.push(index);
    }
  }

  return (
    differences.length === 2 &&
    differences[1] === differences[0] + 1 &&
    a[differences[0]] === b[differences[1]] &&
    a[differences[1]] === b[differences[0]]
  );
}

function fuzzyPrefixScore(term: string, candidates: string[]) {
  if (term.length < 4) {
    return Number.POSITIVE_INFINITY;
  }

  const limit = maxFuzzyDistance(term.length);
  let bestScore = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    if (!candidate) {
      return;
    }

    const prefix = candidate.slice(0, term.length);
    const distance = damerauLevenshteinDistance(term, prefix, limit);

    if (hasSingleAdjacentTransposition(term, prefix)) {
      bestScore = Math.min(bestScore, 35 + index);
      return;
    }

    if (distance <= limit) {
      bestScore = Math.min(bestScore, 40 + distance * 8 + index);
    }
  });

  return bestScore;
}

function scoreTerm(item: SearchItem, term: string) {
  const label = normalizeSearchText(item.label);
  const code = normalizeSearchText(item.code ?? "");
  const meta = normalizeSearchText(item.meta);
  const compactLabel = compactSearchText(item.label);
  const haystack = `${label} ${code} ${meta}`;
  const index = haystack.indexOf(term);

  if (code === term) {
    return 0;
  }

  if (label === term) {
    return 1;
  }

  if (code.startsWith(term)) {
    return 2;
  }

  if (label.startsWith(term)) {
    return 3;
  }

  if (index !== -1) {
    return 10 + index / 100;
  }

  return fuzzyPrefixScore(term, [
    compactLabel,
    ...label.split(/\s+/u)
  ]);
}

export function scoreSearchItem(item: SearchItem, query: string) {
  const terms = normalizeSearchText(query).split(/\s+/u).filter(Boolean);

  if (!terms.length) {
    return Number.POSITIVE_INFINITY;
  }

  return terms.reduce((total, term) => {
    if (!Number.isFinite(total)) {
      return total;
    }

    const score = scoreTerm(item, term);
    return Number.isFinite(score) ? total + score : Number.POSITIVE_INFINITY;
  }, 0);
}

export function rankSearchItems(items: SearchItem[], query: string) {
  return items
    .map((item, searchOrder) => ({ ...item, score: scoreSearchItem(item, query), searchOrder }))
    .filter((item) => Number.isFinite(item.score))
    .sort(
      (a, b) =>
        a.score - b.score ||
        (a.kind === b.kind ? 0 : a.kind === "Company" ? -1 : 1) ||
        (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) ||
        a.searchOrder - b.searchOrder
    );
}
