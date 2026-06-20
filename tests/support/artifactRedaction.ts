import type { TestInfo } from "@playwright/test";

export type ArtifactFinding = {
  pattern: string;
  sample: string;
};

export type ArtifactVerificationResult = {
  ok: boolean;
  findings: ArtifactFinding[];
};

const REDACTION = "[REDACTED]";

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  {
    name: "authorization-header",
    pattern: /\bAuthorization:\s*Bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  },
  {
    name: "staging-access-code",
    pattern:
      /\b(?:PLAYWRIGHT_STAGING_ACCESS_CODE|STAGING_AUTH|STAGING_API_KEY)\s*[=:]\s*["']?[^"'\s,;]{4,}/gi,
  },
  {
    name: "secret-assignment",
    pattern:
      /\b(?:api[_-]?key|token|secret|password|private[_-]?key)\s*[=:]\s*["']?[^"'\s,;]{8,}/gi,
  },
  {
    name: "aws-access-key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  },
  {
    name: "github-token",
    pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    name: "windows-local-path",
    pattern: /\b[A-Z]:\\Users\\[^\\\s]+\\[^\n\r"]*/g,
  },
  {
    name: "hidden-prompt-marker",
    pattern: /\b(?:BEGIN|END) (?:SYSTEM|DEVELOPER|HIDDEN) PROMPT\b/gi,
  },
];

function isArtifactNameChar(char: string) {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    char === "_" ||
    char === "." ||
    char === "-"
  );
}

function stripDashEdges(text: string) {
  let start = 0;
  let end = text.length;

  while (start < end && text[start] === "-") {
    start += 1;
  }
  while (end > start && text[end - 1] === "-") {
    end -= 1;
  }

  return text.slice(start, end);
}

export function sanitizeArtifactName(name: string) {
  let sanitized = "";
  let lastWasDash = false;

  for (const char of name.trim()) {
    if (isArtifactNameChar(char)) {
      sanitized += char;
      lastWasDash = char === "-";
      continue;
    }

    if (!lastWasDash) {
      sanitized += "-";
      lastWasDash = true;
    }
  }

  return stripDashEdges(sanitized).slice(0, 80);
}

function firstNonWhitespaceIndex(text: string) {
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char !== " " && char !== "\t" && char !== "\r") {
      return index;
    }
  }

  return -1;
}

function isCookieHeaderLine(line: string) {
  const start = firstNonWhitespaceIndex(line);
  if (start < 0) {
    return false;
  }

  const headerPrefix = "cookie:";
  const prefix = line.slice(start, start + headerPrefix.length).toLowerCase();
  if (prefix !== headerPrefix) {
    return false;
  }

  return line.indexOf("=", start + headerPrefix.length) >= 0;
}

function redactCookieHeaders(text: string) {
  return text
    .split("\n")
    .map((line) => {
      if (!isCookieHeaderLine(line)) {
        return line;
      }

      const colonIndex = line.indexOf(":");
      return `${line.slice(0, colonIndex + 1)} ${REDACTION}`;
    })
    .join("\n");
}

function findCookieHeaderSecret(text: string) {
  return text.split("\n").find((line) => isCookieHeaderLine(line));
}

export function redactTextArtifact(text: string) {
  const redactedPatterns = SECRET_PATTERNS.reduce(
    (next, { pattern }) => next.replace(pattern, REDACTION),
    text
  );

  return redactCookieHeaders(redactedPatterns);
}

export function verifyTextArtifactRedacted(
  text: string
): ArtifactVerificationResult {
  const findings: ArtifactFinding[] = [];

  for (const { name, pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match?.[0]) {
      findings.push({
        pattern: name,
        sample: match[0].slice(0, 80),
      });
    }
  }

  const cookieHeader = findCookieHeaderSecret(text);
  if (cookieHeader) {
    findings.push({
      pattern: "cookie-header",
      sample: cookieHeader.slice(0, 80),
    });
  }

  return {
    ok: findings.length === 0,
    findings,
  };
}

export async function attachRedactedTextArtifact(
  testInfo: TestInfo,
  name: string,
  text: string,
  contentType = "text/plain"
) {
  const redacted = redactTextArtifact(text);
  const verification = verifyTextArtifactRedacted(redacted);

  if (!verification.ok) {
    throw new Error(
      `Refusing to attach unredacted artifact ${name}: ${verification.findings
        .map((finding) => finding.pattern)
        .join(", ")}`
    );
  }

  await testInfo.attach(sanitizeArtifactName(name), {
    body: redacted,
    contentType,
  });
}
