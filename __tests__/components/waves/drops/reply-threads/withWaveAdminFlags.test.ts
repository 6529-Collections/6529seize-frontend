import { withWaveAdminFlags } from "@/components/waves/drops/reply-threads/withWaveAdminFlags";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

const makeWave = (
  admin: boolean | undefined,
  deletion: boolean | undefined
): ApiWave =>
  ({
    id: "wave-1",
    wave: {
      authenticated_user_eligible_for_admin: admin,
      admin_drop_deletion_enabled: deletion,
    },
  }) as unknown as ApiWave;

const makeReply = (waveId = "wave-1"): ExtendedDrop =>
  ({
    id: "reply-1",
    wave: {
      id: waveId,
      name: "Wave",
      authenticated_user_admin: false,
      admin_drop_deletion_enabled: false,
    },
  }) as unknown as ExtendedDrop;

describe("withWaveAdminFlags", () => {
  it("takes the loaded wave's admin role and delete setting", () => {
    const reply = makeReply();
    const result = withWaveAdminFlags(reply, makeWave(true, true));

    expect(result.wave).toEqual({
      id: "wave-1",
      name: "Wave",
      authenticated_user_admin: true,
      admin_drop_deletion_enabled: true,
    });
    expect(reply.wave.authenticated_user_admin).toBe(false);
  });

  it("returns the same object while the reply and flags are unchanged", () => {
    const reply = makeReply();
    const first = withWaveAdminFlags(reply, makeWave(true, true));

    expect(withWaveAdminFlags(reply, makeWave(true, true))).toBe(first);
    expect(withWaveAdminFlags(reply, makeWave(true, false))).not.toBe(first);
  });

  it("leaves a reply that already matches unchanged", () => {
    const reply = makeReply();

    expect(withWaveAdminFlags(reply, makeWave(false, false))).toBe(reply);
  });

  it("leaves replies from another wave unchanged", () => {
    const reply = makeReply("wave-2");

    expect(withWaveAdminFlags(reply, makeWave(true, true))).toBe(reply);
  });

  it("does not guess when the loaded wave lacks the flags", () => {
    const reply = makeReply();

    expect(withWaveAdminFlags(reply, makeWave(undefined, true))).toBe(reply);
    expect(withWaveAdminFlags(reply, makeWave(true, undefined))).toBe(reply);
  });
});
