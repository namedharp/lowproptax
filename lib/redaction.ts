const REDACTION_VERSION = "pii-v1";

const RULES: Array<[RegExp, string | ((value: string) => string)]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED EMAIL]"],
  [
    /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\d)/g,
    "[REDACTED PHONE]",
  ],
  [/(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)/g, "[REDACTED SSN]"],
  [
    /\b(?:owner|client|taxpayer|contact|applicant)\s*(?:name)?\s*:\s*[^\n,;]{2,100}/gi,
    (value) => `${value.split(":")[0]}: [REDACTED NAME]`,
  ],
  [
    /\b(?:account|customer|client)\s*(?:id|number|no\.?)\s*:\s*[A-Z0-9-]{4,50}\b/gi,
    (value) => `${value.split(":")[0]}: [REDACTED IDENTIFIER]`,
  ],
];

export type RedactionResult = {
  text: string;
  replacements: number;
  version: string;
};

export function redactPrivateExcerpt(input: string): RedactionResult {
  let text = input;
  let replacements = 0;
  for (const [pattern, replacement] of RULES) {
    text = text.replace(pattern, (...args: unknown[]) => {
      replacements += 1;
      if (typeof replacement === "string") return replacement;
      return replacement(String(args[0]));
    });
  }
  return { text, replacements, version: REDACTION_VERSION };
}
