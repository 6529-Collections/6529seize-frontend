/** @jest-environment node */
import { formatCmsRecoveryError } from "@/lib/profile-cms/recovery/errors";
import { cmsRecoveryFilePath } from "@/lib/profile-cms/recovery/static-site";

describe("recovery operator diagnostics", () => {
  it("preserves the renderer's safe path-validation diagnostic", () => {
    let caught: unknown;
    try {
      cmsRecoveryFilePath("/profile/../index.html");
    } catch (error: unknown) {
      caught = error;
    }
    expect(formatCmsRecoveryError(caught)).toBe(
      "Unsafe recovered CMS route path"
    );
  });

  it.each([
    new Error("CMS RPC failed at https://operator:private-value@rpc.example"),
    "CMS RPC failed at https://operator:private-value@rpc.example",
    {
      name: "CmsRecoveryError",
      message: "CMS RPC failed at https://operator:private-value@rpc.example",
    },
  ])(
    "redacts untrusted transport diagnostics even with a CMS prefix",
    (error) => {
      const message = formatCmsRecoveryError(error);
      expect(message).toBe(
        "CMS recovery failed. Check the manifest, expected signer, content hash, output directory and RPC configuration."
      );
      expect(message).not.toContain("private-value");
    }
  );
});
