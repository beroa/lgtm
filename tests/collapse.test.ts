import assert from "node:assert/strict";
import { test } from "node:test";
import { parseHTML } from "linkedom";
import { compilePatterns, isDiffPage } from "../src/commons/patterns";
import { collapseMatchingFiles } from "../src/content/collapse";

// Reduced from the supplied GitHub PR /changes HTML, including lazy headers.
function reactDiff(id: string, path: string, loaded = true) {
  return `<div role="region" id="diff-${id}">
    <div data-diff-header-wrapper="true"><div>
      <div><button aria-labelledby="toggle-${id}"></button>
        <span id="toggle-${id}" data-component="Tooltip">Collapse file</span></div>
      <h3><a href="#diff-${id}"><code>\u200e<!-- -->${path}<!-- -->\u200e</code></a></h3>
      <button aria-labelledby="copy-${id}"></button>
      <span id="copy-${id}">Copy file name to clipboard</span>
      ${loaded ? `<button aria-label="Expand all lines: ${path}" data-file-path="${path}"></button>` : ""}
      <button aria-label="Not Viewed"></button>
    </div></div>
    <div><button aria-labelledby="comment-${id}"></button><span id="comment-${id}">Collapse comment</span></div>
  </div>`;
}

test("supplied PR headers collapse matching loaded and lazy diffs only once", () => {
  const path = "src/apis/foxnews/mobile/type/liveblog/http.test.ts";
  const { document } = parseHTML(`<html><body>
    <div id="diff-comparison-viewer-container">
      <button aria-labelledby="tree-label"></button><span id="tree-label">Collapse file tree</span>
      ${reactDiff("config", "src/apis/foxnews/mobile/type/liveblog/config.js")}
      ${reactDiff("http", path)}
      ${reactDiff("index", "src/apis/foxnews/mobile/type/liveblog/index.test.ts", false)}
    </div></body></html>`);
  const clicked: string[] = [];
  document.addEventListener("click", (event) => {
    const control = event.target as Element;
    clicked.push(
      control.getAttribute("aria-labelledby") ||
        control.getAttribute("aria-label") ||
        "",
    );
  });
  const handled = new WeakMap<Element, string>();
  collapseMatchingFiles(
    document,
    compilePatterns(String.raw`\.test\.`).patterns,
    handled,
  );
  assert.deepEqual(clicked, ["toggle-http", "toggle-index"]);
  collapseMatchingFiles(document, [/\.test\./], handled);
  assert.equal(clicked.length, 2, "manual reopening must survive re-scans");
});

test("lazy header paths support anchors and already collapsed files stay closed", () => {
  const { document } = parseHTML(
    `<html><body>${reactDiff("lazy", "src/http.test.ts", false)}</body></html>`,
  );
  let clicks = 0;
  document.addEventListener("click", () => clicks++);
  const label = document.getElementById("toggle-lazy")!;
  label.textContent = "Expand file";
  collapseMatchingFiles(document, [/^src\/http\.test\.ts$/], new WeakMap());
  assert.equal(clicks, 0);
  label.textContent = "Collapse file";
  collapseMatchingFiles(document, [/^src\/http\.test\.ts$/], new WeakMap());
  assert.equal(clicks, 1);
});

test("patterns validate line numbers and match repository paths", () => {
  const { patterns, errors } = compilePatterns(
    "\\.lock$\n\n[\n(^|/)__snapshots__/",
  );
  assert.deepEqual(errors, ["Line 3: invalid regular expression."]);
  assert.ok(patterns.some((pattern) => pattern.test("nested/yarn.lock")));
  assert.ok(
    patterns.some((pattern) => pattern.test("src/__snapshots__/ui.snap")),
  );
  assert.ok(!patterns.some((pattern) => pattern.test("src/lock.ts")));
  assert.equal(compilePatterns("\n  ").patterns.length, 0);
});

test("only GitHub PR, commit, and compare routes qualify", () => {
  for (const path of [
    "/a/b/pull/12/files",
    "/a/b/pull/12/changes",
    "/a/b/pull/12/commits/abc",
    "/a/b/commit/abc",
    "/a/b/compare/main...test",
  ])
    assert.ok(isDiffPage(path), path);
  for (const path of [
    "/a/b/issues/12",
    "/a/b/blob/main/a.ts",
    "/a/b",
    "/a/b/pulls",
  ])
    assert.ok(!isDiffPage(path), path);
});

test("collapse matches once, preserve manual reopening, and handle newly added files", () => {
  const { document } = parseHTML(`<html><body>
    <div class="file Details--on"><div class="file-header" data-path="yarn.lock"><button class="js-details-target" aria-expanded="true"></button></div></div>
    <div id="diff-other" data-file-path="src/app.ts"><button aria-label="Collapse file"></button></div>
    <div id="diff-closed" data-file-path="package.lock"><button aria-label="Expand file" aria-expanded="false"></button></div>
  </body></html>`);
  let clicks = 0;
  document.addEventListener("click", () => clicks++);
  const handled = new WeakMap<Element, string>();
  collapseMatchingFiles(document, [/\.lock$/], handled);
  assert.equal(clicks, 1);
  collapseMatchingFiles(document, [/\.lock$/], handled);
  assert.equal(clicks, 1, "re-scanning must allow manual reopening");
  document.body.insertAdjacentHTML(
    "beforeend",
    '<div id="diff-new" data-file-path="nested/new.lock"><button aria-label="Collapse file"></button></div>',
  );
  collapseMatchingFiles(document, [/\.lock$/], handled);
  assert.equal(clicks, 2);
  collapseMatchingFiles(document, [/app\.ts$/], new WeakMap());
  assert.equal(clicks, 3, "updated patterns apply to existing files");
});
