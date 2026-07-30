import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const workflowPath = path.join(
  process.cwd(),
  ".github/workflows/release-bus-v2-advance-staging-ref.yml"
);
const workflow = fs.readFileSync(workflowPath, "utf8");

describe("Release Bus v2 staging ref advancement workflow", () => {
  it("authorizes before any ref read or mutation and uses only the workflow token", () => {
    const authorize = workflow.indexOf("Authorize exact v2 operation");
    const checkout = workflow.indexOf("Check out exact target");
    const advance = workflow.indexOf("Advance exact staging ref");

    expect(authorize).toBeGreaterThan(0);
    expect(checkout).toBeGreaterThan(authorize);
    expect(advance).toBeGreaterThan(checkout);
    expect(workflow).toContain("permissions:\n  contents: write");
    expect(workflow).toContain("persist-credentials: true");
    expect(workflow).not.toContain("create-github-app-token");
    expect(workflow).not.toContain("RELEASE_BUS_GITHUB_PRIVATE_KEY");
  });

  it("performs an exact leased fast-forward and verifies its postcondition", () => {
    const ancestry = workflow.indexOf(
      'git merge-base --is-ancestor "$EXPECTED_OLD_SHA" "$EXPECTED_SHA"'
    );
    const alreadyAtTarget = workflow.indexOf(
      'if [ "$observed" = "$EXPECTED_SHA" ]; then'
    );

    expect(ancestry).toBeGreaterThan(0);
    expect(alreadyAtTarget).toBeGreaterThan(ancestry);
    expect(workflow).toContain(
      'git merge-base --is-ancestor "$EXPECTED_OLD_SHA" "$EXPECTED_SHA"'
    );
    expect(workflow).toContain(
      '--force-with-lease="refs/heads/1a-staging:$EXPECTED_OLD_SHA"'
    );
    expect(workflow).toContain('origin "$EXPECTED_SHA:refs/heads/1a-staging"');
    expect(workflow).toContain('if [ "$observed" != "$EXPECTED_SHA" ]; then');
    expect(workflow).toContain(
      "write_result FAILED INTERACTION staging_ref_moved false"
    );
    expect(workflow).toContain(
      "write_result FAILED INFRASTRUCTURE staging_ref_transport true"
    );
    expect(workflow).toContain(
      'write_result SUCCEEDED "" "" false "$observed" false'
    );
    expect(workflow).toContain(
      'if ! [[ "$observed" =~ ^[a-f0-9]{40}$ ]]; then'
    );
  });

  it("is non-cancelling, operation-bound, and emits structured terminal evidence", () => {
    const parsed = YAML.parse(workflow) as {
      concurrency?: { group?: string; ["cancel-in-progress"]?: boolean };
      jobs?: { advance?: { ["timeout-minutes"]?: number } };
      permissions?: { contents?: string };
    };

    expect(parsed.permissions?.contents).toBe("write");
    expect(parsed.concurrency).toEqual({
      group: "release-bus-v2-staging-ref-${{ github.repository }}",
      "cancel-in-progress": false,
    });
    expect(parsed.jobs?.advance?.["timeout-minutes"]).toBe(10);
    expect(workflow).toContain('phase:"advance_staging_ref",status:$status');
    expect(workflow).toContain(
      'repository:"frontend",environment:"staging",service:null'
    );
    expect(workflow).toContain(
      'test "$ADVANCE_OUTCOME" = success -a "$REPORT_OUTCOME" = success'
    );
    expect(workflow).toContain(
      "failure_class=CONTROL_PLANE\n              failure_phase=authorization\n              retryable=false"
    );
  });
});
