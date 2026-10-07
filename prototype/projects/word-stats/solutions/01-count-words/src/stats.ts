export function countWords(text: string): number {
  return words(text).length;
}

function words(text: string): string[] {
  return text.split(/\s+/).filter((word) => word !== "");
}
