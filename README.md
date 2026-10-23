# GitHub Diff Collapser

For the diff you really just don't care about.

## Development

Like the adjacent Virtual Json Viewer extension, this uses React, TypeScript, Vite, and Yarn:

- `src/content.ts` and `src/content/`: GitHub page integration.
- `src/options/`: settings popup.
- `src/commons/`: patterns and local storage.
- `pages/options.html`: popup and settings entry point.
- `public/manifest.json`: extension manifest template.
- `vite.build.ts`: browser-specific builds in `dist/chrome/` and `dist/firefox/`.

```sh
cd lgtm
yarn install
yarn check
yarn test
yarn build:all
```

Load `lgtm/dist/chrome` using **Load unpacked** at `chrome://extensions` with Developer mode enabled. In Firefox, use **Load Temporary Add-on** at `about:debugging#/runtime/this-firefox` and choose `dist/firefox/manifest.json`.

## Usage

Click the extension's toolbar button. Enter one JavaScript regex per line, without slash delimiters or flags, then click **Save patterns**. Use inline character classes if you need case-insensitive matching. Patterns match the entire repository-relative path as a searchable string (add `^` and `$` to anchor a match).

```text
\.lock$
(^|/)__snapshots__/
\.min\.js$
```

The popup validates patterns before saving and includes a file-path tester. Empty settings disable automatic collapsing. Settings are stored locally; no data is sent anywhere.

The content script loads only on `github.com` so it can follow GitHub's in-page navigation, and acts only on PR, commit, and compare routes. Matching files collapse once per rendered control, page navigation, or settings update. You can manually reopen them. Newly loaded diffs are processed automatically. Removing a pattern does not reopen previously collapsed files. The extension uses collapse buttons and never marks files as viewed.

`yarn dev` serves the popup UI; storage requires loading the built extension. GitHub Enterprise domains are not included.

## Verification

`yarn check` checks TypeScript and linting. `yarn test` exercises regex validation, route restrictions, legacy/React-style diff controls, dynamically added files, and respecting manual reopening. Build both targets with `yarn build:all`.

For a browser smoke test, load the extension, save `\.lock$`, and open a PR with a lockfile. Verify that only matching diffs collapse, manually reopen one, and load another diff or navigate to a different PR. Change and clear the patterns with the PR still open. Also test commit/compare views and invalid regex input. GitHub can change its DOM; selectors may need updating for new layouts.
