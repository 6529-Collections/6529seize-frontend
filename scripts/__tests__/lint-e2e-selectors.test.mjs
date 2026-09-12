import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ESLint } from "eslint";
import config from "../../eslint.config.e2e-selectors.mjs";
import { lintSelectors, newViolations } from "../lint-e2e-selectors.mjs";

const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config, allowInlineConfig: false });
const lint = async (source, filePath = "tests/example.spec.ts") =>
  (await eslint.lintText(source, { filePath }))[0].messages;

for (const source of [
  'page.locator(".button")',
  'otherPage.locator(".button")',
  'this.page.locator(".button")',
  'page["locator"](".button")',
  'page[`locator`](".button")',
  'page?.locator(".button")',
  'page!.locator(".button")',
  'page.locator(`.button`)',
  'page.locator(`.button-${id}`)',
  'page.locator(selector)',
  'page.locator("main").getByRole("button")',
  'page.locator(".panel").locator("button")',
  'page.locator("body button")',
  "page.locator('meta[name=\"viewport\"] button')",
]) {
  test(`rejects unscoped locator: ${source}`, async () => {
    const messages = await lint(source);
    assert.ok(messages.length > 0);
    assert.ok(messages.every((message) => message.ruleId === "e2e-selectors/prefer-accessible"));
  });
}

for (const source of [
  'page.getByRole("button", { name: "Save" })',
  'page.getByLabel("Search")',
  'page.getByTestId("artwork")',
  'page.getByRole("dialog").locator(".decorative-icon")',
  'page.getByRole("list").filter({ hasText: "Art" }).first().locator("li").locator("svg")',
  'page["getByRole"]("button").locator("svg")',
  '(page.getByRole("button") as Locator).locator("svg")',
  'page.locator("body")',
  'page.locator(`html`)',
  'page.locator("head")',
  "page.locator('meta[name=\"viewport\"]')",
  'page.locator("meta[property=\'og:title\']")',
  'const example = "page.locator(\'.button\')";',
  '// page.locator(".button")',
]) {
  test(`allows semantic or structural lookup: ${source}`, async () => {
    assert.deepEqual(await lint(source), []);
  });
}

test("checks helpers, TSX, JS and the e2e directory", async () => {
  for (const file of ["tests/support/page.ts", "tests/example.spec.tsx", "tests/helper.js", "e2e/helper.mts"]) {
    assert.equal((await lint('page.locator(".new")', file)).length, 1, file);
  }
  assert.equal((await lint('const view = <div />; page.locator(".new")', "tests/fixture.tsx")).length, 1);
});

test("inline disables cannot hide new violations", async () => {
  const source = '/* eslint-disable */\npage.locator(".new")';
  assert.equal((await lint(source)).length, 1);
});

test("baseline allows exact unchanged calls after line shifts and CRLF changes", async () => {
  const base = 'const target = page.locator(\n  ".old"\n);';
  const current = `// unrelated edit\n${base}`.replaceAll("\n", "\r\n");
  assert.deepEqual(newViolations(current, await lint(current), base, await lint(base)), []);
});

test("baseline rejects additions, replacements and duplicated legacy calls", async () => {
  const base = 'page.locator(".old");';
  for (const current of [
    `${base}\npage.locator(".new");`,
    'page.locator(".replacement");',
    `${base}\n${base}`,
  ]) {
    assert.equal(newViolations(current, await lint(current), base, await lint(base)).length, 1);
  }
  assert.deepEqual(newViolations("", [], base, await lint(base)), []);
});

test("syntax failures are never grandfathered", async () => {
  const source = 'page.locator(".old"';
  const messages = await lint(source);
  assert.ok(messages[0].fatal);
  assert.equal(newViolations(source, messages, source, messages).length, 1);
});

test("Git baseline checks committed, unstaged and untracked files and shrinks with the base", async (t) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-selector-lint-"));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" });
  const write = (file, source) => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), source);
  };
  const commit = () => {
    git("add", ".");
    git("-c", "user.name=Selector Test", "-c", "user.email=selector-test@example.invalid", "-c", "commit.gpgsign=false", "commit", "-s", "-m", "fixture");
  };
  git("init");
  write("tests/old.spec.ts", 'page.locator(".old");');
  commit();
  git("branch", "baseline");
  const options = { cwd, baseRef: "baseline" };
  assert.equal((await lintSelectors(options)).legacy, 1);
  write("tests/old.spec.ts", 'page.locator(".old");\npage.locator(".new");');
  write("tests/support/helper.tsx", 'page.locator(`.helper`);');
  assert.equal((await lintSelectors(options)).failures.length, 2);
  commit();
  assert.equal((await lintSelectors(options)).failures.length, 2);
  write("tests/old.spec.ts", 'page.getByRole("button");');
  write("tests/support/helper.tsx", 'page.getByLabel("Search");');
  commit();
  git("branch", "clean-base");
  write("tests/old.spec.ts", 'page.locator(".old");');
  assert.equal((await lintSelectors({ cwd, baseRef: "clean-base" })).failures.length, 1);
  await assert.rejects(lintSelectors({ cwd, baseRef: "missing-base" }));
});
