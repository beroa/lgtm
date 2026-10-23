export function compilePatterns(text: string) {
  const patterns: RegExp[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const source = line.trim();
    if (!source) return;
    try {
      patterns.push(new RegExp(source));
    } catch {
      errors.push(`Line ${index + 1}: invalid regular expression.`);
    }
  });
  return { patterns, errors };
}

export function isDiffPage(pathname: string) {
  return /^\/[^/]+\/[^/]+\/(?:pull\/\d+(?:\/(?:files|changes|commits)(?:\/.*)?)?\/?|commit\/[^/]+\/?|compare\/.+)$/.test(
    pathname,
  );
}
