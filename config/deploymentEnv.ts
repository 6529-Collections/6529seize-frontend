export function isTrustedVercelRuntime(): boolean {
  return process.env["VERCEL"] === "1";
}
