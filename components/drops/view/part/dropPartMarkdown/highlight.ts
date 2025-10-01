import type { HLJSApi } from "highlight.js";

let highlighterPromise: Promise<HLJSApi> | null = null;

const loadHighlighter = async (): Promise<HLJSApi> => {
  highlighterPromise ??= (async () => {
    const [
      core,
      tsModule,
      jsModule,
      jsonModule,
      bashModule,
      pythonModule,
      goModule,
      rustModule,
      sqlModule,
    ] = await Promise.all([
      import("highlight.js/lib/core"),
      import("highlight.js/lib/languages/typescript"),
      import("highlight.js/lib/languages/javascript"),
      import("highlight.js/lib/languages/json"),
      import("highlight.js/lib/languages/bash"),
      import("highlight.js/lib/languages/python"),
      import("highlight.js/lib/languages/go"),
      import("highlight.js/lib/languages/rust"),
      import("highlight.js/lib/languages/sql"),
    ]);

    const hljs: HLJSApi = core.default;

    hljs.registerLanguage("ts", tsModule.default);
    hljs.registerLanguage("tsx", tsModule.default);
    hljs.registerLanguage("typescript", tsModule.default);
    hljs.registerLanguage("js", jsModule.default);
    hljs.registerLanguage("jsx", jsModule.default);
    hljs.registerLanguage("javascript", jsModule.default);
    hljs.registerLanguage("json", jsonModule.default);
    hljs.registerLanguage("bash", bashModule.default);
    hljs.registerLanguage("shell", bashModule.default);
    hljs.registerLanguage("py", pythonModule.default);
    hljs.registerLanguage("python", pythonModule.default);
    hljs.registerLanguage("go", goModule.default);
    hljs.registerLanguage("golang", goModule.default);
    hljs.registerLanguage("rust", rustModule.default);
    hljs.registerLanguage("rs", rustModule.default);
    hljs.registerLanguage("sql", sqlModule.default);

    return hljs;
  })();

  return highlighterPromise;
};

export const highlightCodeElement = async (
  element: HTMLElement,
  languageHint?: string | null
) => {
  const text = element.textContent ?? "";
  if (!text.trim()) {
    return;
  }

  const hljs = await loadHighlighter();

  if (!element.isConnected) {
    return;
  }

  const hintedLanguage = languageHint?.toLowerCase() ?? null;
  const language = hintedLanguage && hljs.getLanguage(hintedLanguage)
    ? hintedLanguage
    : null;

  element.classList.add("hljs");

  if (language) {
    element.classList.add(`language-${language}`);
    hljs.highlightElement(element);
    return;
  }

  const { value, language: detectedLanguage } = hljs.highlightAuto(text);
  element.innerHTML = value;
  element.dataset.highlighted = "yes";

  if (detectedLanguage) {
    element.classList.add(`language-${detectedLanguage}`);
  }
};
