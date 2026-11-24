/** @jest-environment node */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  VALIDATOR_CLOUD_INIT_PATH,
  VALIDATOR_CLOUD_INIT_SHA256,
  VALIDATOR_CLOUD_INIT_URL,
  VALIDATOR_CLOUD_INIT_USER_DATA,
} from "@/lib/validator-page/cloudInit";

// The hash holders have pasted into their servers' user data. The published
// file must never change: a new script is cloud-init-v2.sh, with its own hash.
const PUBLISHED_V1_SHA256 =
  "187ae6ac6461ecb6d89c261c037985b52a4d7756bf2eefd773d5f474fb37690b";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SCRIPT_BYTES = readFileSync(
  path.join(PUBLIC_DIR, ...VALIDATOR_CLOUD_INIT_PATH.split("/"))
);
const SCRIPT = SCRIPT_BYTES.toString("utf8");

// Runs a checker on text given on standard input, so no path has to make
// sense to it. Returns null when the program isn't installed here.
function check(program: string, args: string[], input: string) {
  const result = spawnSync(program, args, { input, encoding: "utf8" });
  return result.error ? null : result;
}
const hasProgram = (program: string) =>
  check(program, ["--version"], "") !== null;
// CI's runner (GitHub's ubuntu-latest) has both programs, so there a missing
// one fails the test. A developer's machine without one skips it.
const inCi = Boolean(process.env["CI"]);
const itWithBash = inCi || hasProgram("bash") ? it : it.skip;
const itWithShellcheck = inCi || hasProgram("shellcheck") ? it : it.skip;

describe("the validator's cloud startup script", () => {
  it("is the published file, byte for byte", () => {
    const digest = createHash("sha256").update(SCRIPT_BYTES).digest("hex");
    expect(digest).toBe(PUBLISHED_V1_SHA256);
    expect(VALIDATOR_CLOUD_INIT_SHA256).toBe(PUBLISHED_V1_SHA256);
  });

  it("is served from 6529.io at its path under public/validator", () => {
    expect(VALIDATOR_CLOUD_INIT_PATH).toBe("/validator/cloud-init-v1.sh");
    expect(VALIDATOR_CLOUD_INIT_URL).toBe(
      "https://6529.io/validator/cloud-init-v1.sh"
    );
  });

  it("is the only startup script in public/validator", () => {
    const scripts = readdirSync(path.join(PUBLIC_DIR, "validator")).filter(
      (name) => name.endsWith(".sh")
    );
    expect(scripts).toEqual(["cloud-init-v1.sh"]);
  });

  it("starts with #!/bin/bash and has Unix line ends and plain ASCII", () => {
    expect(SCRIPT.startsWith("#!/bin/bash\n")).toBe(true);
    expect(SCRIPT.endsWith("\n")).toBe(true);
    expect(SCRIPT).not.toContain("\r");
    expect(SCRIPT_BYTES.every((byte) => byte < 0x80)).toBe(true);
  });

  it("runs once: it stops at the marker, and sets the marker when done", () => {
    const lines = SCRIPT.trimEnd().split("\n");
    const marker = lines.indexOf(
      "if [ -e /root/.6529-validator-setup-done ]; then"
    );
    expect(lines.indexOf("set -euo pipefail")).toBe(marker - 1);
    expect(lines.slice(marker + 1, marker + 4)).toEqual([
      '    echo "6529 validator: already set up. To run it again, delete /root/.6529-validator-setup-done first."',
      "    exit 0",
      "fi",
    ]);
    expect(lines.at(-2)).toBe("touch /root/.6529-validator-setup-done");
  });

  it("takes only a .deb of the package's own name", () => {
    expect(SCRIPT).toContain(
      'package = re.compile(r"6529-validator_[0-9][0-9A-Za-z.~+-]*_" + re.escape(arch) + r"\\.deb")'
    );
    expect(SCRIPT).toContain('if package.fullmatch(str(f["name"]))]');
  });

  it("waits for apt's lists: up to 6 updates, 20 seconds apart", () => {
    expect(SCRIPT).toContain(
      "until apt-get -o DPkg::Lock::Timeout=600 -o Acquire::Retries=3 update; do\n" +
        '    [ "$TRIES" -lt 6 ] || fail "apt-get update failed 6 times. Nothing was installed."\n' +
        "    TRIES=$((TRIES + 1))\n" +
        "    sleep 20\n" +
        "done\n"
    );
  });

  it("needs python3, and makes no swap file below 4 GB free", () => {
    expect(SCRIPT).toContain(
      'command -v python3 >/dev/null || fail "this script needs python3. Nothing was installed."'
    );
    expect(SCRIPT).toContain('    if [ "${FREE_KB:-0}" -lt 4194304 ]; then');
  });

  it("downloads over HTTPS only and tries again when 6529.io doesn't answer", () => {
    expect(SCRIPT).toContain(
      "CURL=(curl -fsSL --proto '=https' --proto-redir '=https' --retry 5 --retry-delay 10 --retry-connrefused)"
    );
    expect(SCRIPT).toContain(
      '"${CURL[@]}" -o releases.json https://6529.io/validator/releases.json'
    );
    expect(SCRIPT).toContain(
      '"${CURL[@]}" -w \'%{content_type}\' -o "$FILE" "https://6529.io/validator/download/$VERSION/$FILE"'
    );
    expect(SCRIPT.match(/\bcurl\b/g)).toHaveLength(1);
  });

  it("says so when 6529.io's password gate answers in place of the download", () => {
    expect(SCRIPT).toContain(
      '    text/html*) fail "6529.io asks for a password before it hands out $FILE. Nothing was installed." ;;'
    );
  });

  it("stops at once on a system without dpkg and apt-get", () => {
    const lines = SCRIPT.split("\n");
    const guard = lines.indexOf(
      "if ! command -v dpkg >/dev/null || ! command -v apt-get >/dev/null; then"
    );
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(
      lines.indexOf(
        "# A 2 GB swap file: catching up after a long time off can briefly need more"
      )
    );
  });

  it("installs the release only after its SHA-256 matches 6529's list", () => {
    const hashCheck = SCRIPT.indexOf('echo "$SUM  $FILE" | sha256sum -c -');
    const install = SCRIPT.indexOf('install -y "./$FILE"');
    expect(hashCheck).toBeGreaterThan(0);
    expect(install).toBeGreaterThan(hashCheck);
    expect(SCRIPT).toContain(
      "runuser -u validator6529 -- validator init --data-dir /var/lib/6529-validator \\\n" +
        "    --mode datacenter --ui-bind 127.0.0.1:6530 --force \\\n" +
        "    || fail "
    );
  });

  it("ends every step that can fail with one plain line", () => {
    for (const step of [
      '    || fail "couldn\'t download the list of releases. Nothing was installed."',
      '    || fail "couldn\'t download $FILE. Nothing was installed."',
      '    || fail "apt-get couldn\'t install $FILE."',
      '    || fail "the validator is installed, but setting up data-center mode failed."',
      '    || fail "the validator is set up, but it didn\'t restart: run sudo systemctl restart 6529-validator"',
    ]) {
      expect(SCRIPT).toContain(step);
    }
  });

  it("takes only the newest release, the one 6529.io hands out, and never an unsafe one", () => {
    expect(SCRIPT).toContain('release = feed["releases"][0]');
    expect(SCRIPT).toContain(
      'stop("the newest release, " + version + ", is marked unsafe.")'
    );
  });

  it("goes on without swap when the swap file can't be made", () => {
    expect(SCRIPT).toContain(
      "    elif fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile; then\n" +
        '        echo "/swapfile none swap sw 0 0" >> /etc/fstab\n' +
        "    else\n" +
        "        rm -f /swapfile\n"
    );
  });

  itWithBash("parses as bash", () => {
    const result = check("bash", ["-n"], SCRIPT);
    expect(result?.stderr).toBe("");
    expect(result?.status).toBe(0);
  });

  // Errors only: the published file can't change, so a newer shellcheck's
  // new style warnings must not fail the build. 0.9.0 reports nothing at all.
  itWithShellcheck("has no shellcheck errors", () => {
    const result = check(
      "shellcheck",
      ["-s", "bash", "-S", "error", "-"],
      SCRIPT
    );
    expect(result?.stdout).toBe("");
    expect(result?.status).toBe(0);
  });
});

describe("the user data a holder pastes", () => {
  it("downloads the script, checks its hash, and only then runs it", () => {
    expect(VALIDATOR_CLOUD_INIT_USER_DATA).toBe(
      [
        "#!/bin/bash",
        "curl -fsSL --proto '=https' --proto-redir '=https' --retry 5 --retry-delay 10 --retry-connrefused -o /root/6529-setup.sh https://6529.io/validator/cloud-init-v1.sh",
        `echo "${PUBLISHED_V1_SHA256}  /root/6529-setup.sh" | sha256sum -c - && bash /root/6529-setup.sh`,
        "",
      ].join("\n")
    );
  });

  it("names the published path and hash", () => {
    expect(VALIDATOR_CLOUD_INIT_USER_DATA).toContain(VALIDATOR_CLOUD_INIT_URL);
    expect(VALIDATOR_CLOUD_INIT_USER_DATA).toContain(
      `${VALIDATOR_CLOUD_INIT_SHA256}  /root/6529-setup.sh`
    );
    expect(VALIDATOR_CLOUD_INIT_USER_DATA).not.toContain("\r");
  });

  itWithBash("parses as bash", () => {
    const result = check("bash", ["-n"], VALIDATOR_CLOUD_INIT_USER_DATA);
    expect(result?.stderr).toBe("");
    expect(result?.status).toBe(0);
  });

  itWithShellcheck("has no shellcheck findings", () => {
    const result = check(
      "shellcheck",
      ["-s", "bash", "-"],
      VALIDATOR_CLOUD_INIT_USER_DATA
    );
    expect(result?.stdout).toBe("");
    expect(result?.status).toBe(0);
  });
});
