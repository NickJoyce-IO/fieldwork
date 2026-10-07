export function countWords(text: string): number {
  return words(text).length;
}

export function mostCommonWord(text: string): string | undefined {
  const counts = new Map<string, number>();
  for (const word of words(text.toLowerCase())) counts.set(word, (counts.get(word) ?? 0) + 1);
  let best: string | undefined;
  for (const [word, count] of counts) if (best === undefined || count > counts.get(best)!) best = word;
  return best;
}

function words(text: string): string[] {
  return text.split(/\s+/).filter((word) => word !== "");
}
