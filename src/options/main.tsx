import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { compilePatterns } from "../commons/patterns";
import { readPatterns, savePatterns } from "../commons/storage";
import "./options.css";

function Options() {
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [sample, setSample] = useState("");
  const { patterns, errors } = compilePatterns(text);
  useEffect(() => {
    readPatterns()
      .then((value) => {
        setText(value);
        setReady(true);
      })
      .catch(() =>
        setStatus(
          "Could not load settings. Reopen the extension popup to retry.",
        ),
      );
  }, []);
  return (
    <main>
      <h1>GitHub Diff Collapser</h1>
      <p>
        Keep reviews focused. Automatically collapse files matching any of your
        patterns.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!ready || saving || errors.length) return;
          setSaving(true);
          try {
            await savePatterns(text);
            setStatus("Saved. Patterns applied to open GitHub diffs.");
          } catch {
            setStatus("Could not save settings. Please try again.");
          } finally {
            setSaving(false);
          }
        }}
      >
        <label htmlFor="patterns">Filename patterns</label>
        <p id="help">
          One regex per line, without / delimiters. Case-sensitive; matches the
          full repository-relative path. Blank lines are ignored.
        </p>
        <textarea
          id="patterns"
          rows={8}
          spellCheck={false}
          disabled={!ready || saving}
          aria-describedby="help errors"
          aria-invalid={errors.length > 0}
          value={text}
          placeholder={"\\.lock$\n(^|/)__snapshots__/\n\\.min\\.js$"}
          onChange={(event) => {
            setText(event.target.value);
            setStatus("");
          }}
        />
        <div id="errors" role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
        <label htmlFor="sample">Try a file path</label>
        <input
          id="sample"
          value={sample}
          placeholder="src/components/__snapshots__/Button.snap"
          onChange={(event) => setSample(event.target.value)}
        />
        {sample && (
          <p>
            {patterns.some((pattern) => pattern.test(sample))
              ? "Matches — this diff will collapse."
              : "No match — this diff stays as it is."}
          </p>
        )}
        <button disabled={!ready || saving || errors.length > 0}>
          {saving ? "Saving…" : "Save patterns"}
        </button>
        <p role="status">{status}</p>
      </form>
      <footer>
        You can reopen collapsed files anytime. Clear all patterns and save to
        stop automatic collapsing. Already collapsed files stay collapsed.
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Options />);
