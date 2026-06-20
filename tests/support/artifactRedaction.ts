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
    name: "cookie-header",
    pattern: /\bCookie:\s*[^;\n\r]+=[^;\n\r]{8,}/gi,
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

export function sanitizeArtifactName(name: string) {
  return name
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function redactTextArtifact(text: string) {
  return SECRET_PATTERNS.reduce(
    (next, { pattern }) => next.replace(pattern, REDACTION),
    text
  );
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
