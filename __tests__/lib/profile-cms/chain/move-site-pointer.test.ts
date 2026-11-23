import {
  moveProfileSitePointer,
  waitForProfileSitePrimary,
} from "@/lib/profile-cms/chain/move-site-pointer";
import {
  ProfileDocWriteError,
  registerProfileDocWriter,
  type ProfileDocSigner,
  type ProfileDocWriter,
} from "@/lib/profile-cms/chain/profile-doc-writer";

const POINTER = {
  publication: "bafkreie5cyyazg2mwjwk7foh6qhhev4ize3dkpz5656e6ty6sjn4zyfzjq",
  package: "bafkreiej3lbdjacakabv566nmsdidmktb6sxt765d7skg2sakrog2ttsiq",
};
const TX_ID = `0x${"ab".repeat(32)}`;

function fakeWriter(
  signers: readonly ProfileDocSigner[],
  outcome: (signer: ProfileDocSigner) => Error | null = () => null
) {
  const docs: Record<string, string>[] = [];
  const used: ProfileDocSigner[] = [];
  const writer: ProfileDocWriter = {
    availableSigners: async () => signers,
    replaceProfileDoc: async (edit, signer) => {
      used.push(signer);
      const failure = outcome(signer);
      if (failure) throw failure;
      const next = edit(
        new Map([
          ["bio", "kept"],
          ["cms.archive", "bafkreiarchive"],
        ])
      );
      docs.push(Object.fromEntries(next));
      return { txId: TX_ID };
    },
  };
  return { writer, docs, used };
}

describe("moveProfileSitePointer", () => {
  afterEach(() => registerProfileDocWriter(null));

  it("signs with the session key when this browser has one", async () => {
    const { writer, docs, used } = fakeWriter(["wallet", "session-key"]);
    const result = await moveProfileSitePointer({
      pointer: POINTER,
      writer,
      confirm: async () => true,
    });
    expect(result).toEqual({
      ok: true,
      txId: TX_ID,
      signer: "session-key",
      confirmed: true,
    });
    expect(used).toEqual(["session-key"]);
    expect(docs).toEqual([
      {
        bio: "kept",
        "cms.archive": "bafkreiarchive",
        "cms.primary.package": POINTER.package,
        "cms.primary.publication": POINTER.publication,
      },
    ]);
  });

  it("falls back to the wallet when the chain refuses the session key", async () => {
    const { writer, used } = fakeWriter(["session-key", "wallet"], (signer) =>
      signer === "session-key"
        ? new ProfileDocWriteError("session_key_unusable", "expired")
        : null
    );
    const result = await moveProfileSitePointer({ pointer: null, writer });
    expect(result).toMatchObject({
      ok: true,
      signer: "wallet",
      confirmed: false,
    });
    expect(used).toEqual(["session-key", "wallet"]);
  });

  it("uses the wallet when there is no session key", async () => {
    const { writer, used } = fakeWriter(["wallet"]);
    expect(
      await moveProfileSitePointer({ pointer: POINTER, writer })
    ).toMatchObject({ ok: true, signer: "wallet" });
    expect(used).toEqual(["wallet"]);
  });

  it("reports a canceled wallet signature", async () => {
    const { writer } = fakeWriter(
      ["wallet"],
      () => new ProfileDocWriteError("signature_rejected", "user rejected")
    );
    expect(
      await moveProfileSitePointer({ pointer: POINTER, writer })
    ).toMatchObject({ ok: false, code: "signature_rejected" });
  });

  it("reports a failed submit", async () => {
    const { writer } = fakeWriter(
      ["wallet"],
      () => new ProfileDocWriteError("submit_failed", "gateway refused")
    );
    expect(await moveProfileSitePointer({ pointer: POINTER, writer })).toEqual({
      ok: false,
      code: "chain_failed",
      message: "gateway refused",
    });
  });

  it("is unavailable without profile tools or signers", async () => {
    expect(await moveProfileSitePointer({ pointer: POINTER })).toMatchObject({
      ok: false,
      code: "chain_unavailable",
    });
    expect(
      await moveProfileSitePointer({
        pointer: POINTER,
        writer: fakeWriter([]).writer,
      })
    ).toMatchObject({ ok: false, code: "chain_unavailable" });
  });

  it("uses the registered writer by default", async () => {
    const { writer, used } = fakeWriter(["wallet"]);
    registerProfileDocWriter(writer);
    await moveProfileSitePointer({ pointer: POINTER });
    expect(used).toEqual(["wallet"]);
  });
});

describe("waitForProfileSitePrimary", () => {
  it("stops as soon as 6529.io serves the expected package", async () => {
    const answers = [null, "sha256:old", "sha256:new"];
    const sleeps: number[] = [];
    const confirmed = await waitForProfileSitePrimary({
      expectedPackageHash: "sha256:new",
      fetchPrimaryPackageHash: async () => answers.shift() ?? null,
      intervalMs: 10,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      now: () => 0,
    });
    expect(confirmed).toBe(true);
    expect(sleeps).toEqual([10, 10]);
  });

  it("keeps polling through errors and gives up at the deadline", async () => {
    let clock = 0;
    const confirmed = await waitForProfileSitePrimary({
      expectedPackageHash: null,
      fetchPrimaryPackageHash: async () => {
        throw new Error("lagging");
      },
      timeoutMs: 30,
      intervalMs: 10,
      sleep: async (ms) => {
        clock += ms;
      },
      now: () => clock,
    });
    expect(confirmed).toBe(false);
    expect(clock).toBe(30);
  });
});
