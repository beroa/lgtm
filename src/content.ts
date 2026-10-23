import { compilePatterns, isDiffPage } from "./commons/patterns";
import { readPatterns, storageKey } from "./commons/storage";
import { collapseMatchingFiles } from "./content/collapse";

let patterns: RegExp[] = [];
let handled = new WeakMap<Element, string>();
let currentPage = location.pathname + location.search;
let pending = false;

function schedule() {
  if (pending) return;
  pending = true;
  window.setTimeout(() => {
    pending = false;
    const nextPage = location.pathname + location.search;
    if (nextPage !== currentPage) {
      handled = new WeakMap();
      currentPage = nextPage;
    }
    if (patterns.length && isDiffPage(location.pathname)) {
      collapseMatchingFiles(document, patterns, handled);
    }
  }, 100);
}

async function refresh() {
  try {
    patterns = compilePatterns(await readPatterns()).patterns;
    handled = new WeakMap();
    schedule();
  } catch (error) {
    console.warn("GitHub Diff Collapser: could not load settings", error);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && storageKey in changes) void refresh();
});
new MutationObserver(schedule).observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: [
    "data-path",
    "data-file-path",
    "aria-expanded",
    "aria-label",
    "aria-labelledby",
  ],
});
document.addEventListener("turbo:load", schedule);
document.addEventListener("pjax:end", schedule);
window.addEventListener("popstate", schedule);
void refresh();
