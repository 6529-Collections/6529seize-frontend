import { canShowDropBoostAction } from "@/helpers/waves/drop-boost.helpers";

const createDrop = ({
  authorId = "author-id",
  authorHandle = "alice",
  authenticatedUserAdmin = false,
  waveAuthorHandle = "creator",
}: {
  readonly authorId?: string;
  readonly authorHandle?: string;
  readonly authenticatedUserAdmin?: boolean;
  readonly waveAuthorHandle?: string | null;
} = {}) =>
  ({
    author: {
      id: authorId,
      handle: authorHandle,
    },
    wave: {
      authenticated_user_admin: authenticatedUserAdmin,
      wave_author_handle: waveAuthorHandle,
    },
  }) as any;

describe("canShowDropBoostAction", () => {
  it("hides own drops for non-admins who did not create the wave", () => {
    expect(
      canShowDropBoostAction({
        drop: createDrop({ waveAuthorHandle: "bob" }),
        connectedProfile: { id: "author-id", handle: "alice" },
      })
    ).toBe(false);
  });

  it("shows own drops for wave admins", () => {
    expect(
      canShowDropBoostAction({
        drop: createDrop({
          authenticatedUserAdmin: true,
          waveAuthorHandle: "bob",
        }),
        connectedProfile: { id: "author-id", handle: "alice" },
      })
    ).toBe(true);
  });

  it("shows own drops for wave creators", () => {
    expect(
      canShowDropBoostAction({
        drop: createDrop({ waveAuthorHandle: "alice" }),
        connectedProfile: { id: "author-id", handle: "alice" },
      })
    ).toBe(true);
  });

  it("shows drops from other authors", () => {
    expect(
      canShowDropBoostAction({
        drop: createDrop(),
        connectedProfile: { id: "viewer-id", handle: "bob" },
      })
    ).toBe(true);
  });

  it("hides the action without a connected profile", () => {
    expect(
      canShowDropBoostAction({
        drop: createDrop(),
        connectedProfile: null,
      })
    ).toBe(false);
  });
});
