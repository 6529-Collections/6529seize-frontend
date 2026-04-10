import { renderHook, act } from "@testing-library/react";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { CreateWaveGroupConfigType, CreateWaveStep } from "@/types/waves.types";

const exampleIdentity = {
  profile_id: "profile-1",
  handle: "alpha",
  normalised_handle: "alpha",
  primary_wallet: "0xABC",
  display: "Alpha",
  tdh: 0,
  level: 0,
  cic_rating: 0,
  wallet: "0xABC",
  pfp: null,
};

describe("useWaveConfig", () => {
  it("prevents step change when validation fails", () => {
    const { result } = renderHook(() => useWaveConfig());
    act(() => {
      result.current.onStep({
        step: CreateWaveStep.GROUPS,
        direction: "forward",
      });
    });
    expect(result.current.step).toBe(CreateWaveStep.OVERVIEW);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });

  it("updates drops admin delete flag", () => {
    const { result } = renderHook(() => useWaveConfig());
    act(() => {
      result.current.setDropsAdminCanDelete(true);
    });
    expect(result.current.config.drops.adminCanDeleteDrops).toBe(true);
  });

  it("stores inline group draft state per slot", () => {
    const { result } = renderHook(() => useWaveConfig());

    act(() => {
      result.current.addGroupBuilderIdentity(
        CreateWaveGroupConfigType.CAN_VIEW,
        exampleIdentity
      );
    });

    expect(
      result.current.groupBuilders[CreateWaveGroupConfigType.CAN_VIEW]
        .identities
    ).toHaveLength(1);
    expect(
      result.current.groupBuilders[CreateWaveGroupConfigType.CAN_VIEW].draft
        .group.identity_addresses
    ).toEqual(["0xabc"]);
    expect(
      result.current.groupBuilders[CreateWaveGroupConfigType.CAN_VOTE]
        .identities
    ).toHaveLength(0);
  });

  it("resets inline group builder state when overview type changes", () => {
    const { result } = renderHook(() => useWaveConfig());

    act(() => {
      result.current.addGroupBuilderIdentity(
        CreateWaveGroupConfigType.ADMIN,
        exampleIdentity
      );
    });

    act(() => {
      result.current.setOverview({
        type: ApiWaveType.Rank,
        name: "Updated Wave",
        image: null,
      });
    });

    expect(
      result.current.groupBuilders[CreateWaveGroupConfigType.ADMIN].identities
    ).toHaveLength(0);
    expect(
      result.current.groupBuilders[CreateWaveGroupConfigType.ADMIN].draft.group
        .identity_addresses
    ).toBeNull();
  });
});
