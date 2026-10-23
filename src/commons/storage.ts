export const storageKey = "collapsePatterns";

export async function readPatterns(): Promise<string> {
  const result = await chrome.storage.local.get(storageKey);
  return typeof result[storageKey] === "string" ? result[storageKey] : "";
}

export async function savePatterns(patterns: string) {
  await chrome.storage.local.set({ [storageKey]: patterns });
}
