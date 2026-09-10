import { CmsDraftRecoveryController } from "@/lib/profile-cms/builder/recovery";
import {
  buildCmsPackageCandidate,
  createDefaultCmsBuilderState,
} from "@/lib/profile-cms/builder/package";

const cmsPackage = buildCmsPackageCandidate(
  createDefaultCmsBuilderState("punk6529")
);
describe("CMS draft recovery", () => {
  beforeEach(() => localStorage.clear());

  it("keeps a previous unsaved copy until its owner explicitly recovers or discards it", () => {
    const key = "profile-cms-recovery-v1:profile:wallet-a";
    const previous = {
      cmsPackage,
      draftId: "saved-1",
      jsonDraft: "{ unfinished JSON",
    };
    localStorage.setItem(key, JSON.stringify(previous));
    const recovery = new CmsDraftRecoveryController(key, "punk6529");
    recovery.save(null);
    recovery.load();
    recovery.save(null);
    expect(recovery.getSnapshot().recovery).toEqual(previous);
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(previous);
    recovery.dismiss();
    recovery.save(null);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("isolates recovery by wallet and rejects a mismatched profile payload", () => {
    localStorage.setItem("wallet-a", JSON.stringify({ cmsPackage }));
    const otherWallet = new CmsDraftRecoveryController("wallet-b", "punk6529");
    otherWallet.load();
    expect(otherWallet.getSnapshot().recovery).toBeNull();
    const otherProfile = new CmsDraftRecoveryController("wallet-a", "other");
    otherProfile.load();
    expect(otherProfile.getSnapshot().recovery).toBeNull();
  });

  it("resumes saving current work after a corrupt stored entry fails to load", () => {
    const key = "corrupt-draft";
    localStorage.setItem(key, "{ unfinished stored JSON");
    const recovery = new CmsDraftRecoveryController(key, "punk6529");
    recovery.load();
    expect(recovery.getSnapshot()).toEqual({ recovery: null, failed: true });

    const current = { cmsPackage, jsonDraft: "{ current unsaved work" };
    recovery.save(current);

    expect(localStorage.getItem(key)).toBe(JSON.stringify(current));
    expect(recovery.getSnapshot()).toEqual({ recovery: null, failed: false });
  });

  it("reports unavailable storage without breaking editing", () => {
    const read = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const recovery = new CmsDraftRecoveryController("draft", "punk6529");
    expect(() => recovery.load()).not.toThrow();
    expect(recovery.getSnapshot().failed).toBe(true);
    read.mockRestore();
    recovery.dismiss();
    recovery.save({ cmsPackage });
    expect(localStorage.getItem("draft")).not.toBeNull();
  });

  it("recovers a structurally safe draft while its authored URL is still incomplete", () => {
    const invalid = buildCmsPackageCandidate({
      ...createDefaultCmsBuilderState("punk6529"),
      blocks: [
        {
          ...createDefaultCmsBuilderState("punk6529").blocks[2]!,
          kind: "button_link",
          url: "https://",
        },
      ],
    });
    localStorage.setItem("unfinished", JSON.stringify({ cmsPackage: invalid }));
    const recovery = new CmsDraftRecoveryController("unfinished", "punk6529");
    recovery.load();
    expect(recovery.getSnapshot().failed).toBe(false);
    expect(recovery.getSnapshot().recovery!.cmsPackage).toEqual(invalid);
  });

  it("keeps structurally invalid draft content as repairable JSON instead of dropping it", () => {
    const invalid = {
      ...cmsPackage,
      site: { ...cmsPackage.site, title: "x".repeat(500) },
    };
    localStorage.setItem("unfinished", JSON.stringify({ cmsPackage: invalid }));
    const recovery = new CmsDraftRecoveryController("unfinished", "punk6529");
    recovery.load();
    expect(JSON.parse(recovery.getSnapshot().recovery!.jsonDraft!)).toEqual(
      invalid
    );
  });
});
