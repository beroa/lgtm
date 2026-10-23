// Use GitHub's own controls so expanding a file and keyboard navigation still work.
export function collapseMatchingFiles(
  root: Document,
  patterns: RegExp[],
  handled: WeakMap<Element, string>,
) {
  const controls = root.querySelectorAll<HTMLElement>(
    '.file-header .js-details-target, button[aria-label="Collapse file"], button[aria-label="Expand file"], button[aria-label^="Collapse file:"], button[aria-label^="Expand file:"], [data-diff-header-wrapper] button[aria-labelledby]',
  );
  for (const control of controls) {
    const label =
      control
        .getAttribute("aria-labelledby")
        ?.split(/\s+/)
        .map((id) => root.getElementById(id)?.textContent || "")
        .join(" ")
        .trim() ||
      control.getAttribute("aria-label") ||
      "";
    if (
      !control.classList.contains("js-details-target") &&
      !/^(?:Collapse|Expand) file(?::.*)?$/.test(label)
    )
      continue;
    const container = control.closest(
      '.file, [data-file-path], [data-testid="diff-file"], [id^="diff-"]',
    );
    if (!container) continue;
    const header = control.closest("[data-diff-header-wrapper]");
    const pathElement = (header || container).querySelector(
      '[data-path], [data-file-path], .file-info a[title], [data-testid="file-name"]',
    );
    const path =
      container.getAttribute("data-file-path") ||
      pathElement?.getAttribute("data-path") ||
      pathElement?.getAttribute("data-file-path") ||
      pathElement?.getAttribute("title") ||
      pathElement?.textContent?.trim() ||
      // Lazy React diffs only expose the path in the header link. GitHub
      // wraps that text in left-to-right marks, which are not part of the path.
      header
        ?.querySelector('h3 a[href^="#diff-"] code')
        ?.textContent?.replace(/^\u200e|\u200e$/g, "");
    if (!path || handled.get(control) === path) continue;
    if (!patterns.some((pattern) => pattern.test(path))) continue;
    handled.set(control, path);
    const expanded = control.getAttribute("aria-expanded");
    if (
      expanded === "false" ||
      label.startsWith("Expand file") ||
      (container.classList.contains("Details--on") === false &&
        control.classList.contains("js-details-target") &&
        expanded !== "true")
    )
      continue;
    control.click();
  }
}
