import { renderHook, waitFor } from "@testing-library/react";
import { useSubwaveWaveConfig } from "@/components/waves/create-wave/hooks/useSubwaveWaveConfig";
import { useWaveConfig } from "@/components/waves/create-wave/hooks/useWaveConfig";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/components/waves/create-wave/hooks/useWaveConfig", () => ({
  useWaveConfig: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const mockedUseWaveConfig = useWaveConfig as jest.Mock;
const mockedCommonApiFetch = commonApiFetch as jest.Mock;

const createWaveConfigController = (adminGroupId: string | null = null) => ({
  config: {
    overview: { type: "CHAT" },
    groups: {
      admin: adminGroupId,
      canView: null,
      canDrop: null,
      canVote: null,
      canChat: null,
    },
  },
  groupsCache: {},
  setOverview: jest.fn(),
});

describe("useSubwaveWaveConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseWaveConfig.mockReturnValue(createWaveConfigController());
    mockedCommonApiFetch.mockResolvedValue({
      id: "parent-admin-group",
      name: "Parent admins",
    });
  });

  it("uses the parent admin group and loads its display details", async () => {
    const { result } = renderHook(() =>
      useSubwaveWaveConfig({ parentAdminGroupId: "parent-admin-group" })
    );

    expect(result.current.config.groups.admin).toBe("parent-admin-group");
    expect(mockedCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "groups/parent-admin-group",
      signal: expect.any(AbortSignal),
    });
    await waitFor(() => {
      expect(result.current.groupsCache["parent-admin-group"]).toMatchObject({
        id: "parent-admin-group",
        name: "Parent admins",
      });
    });
  });

  it("keeps a different admin group selected by the creator", () => {
    mockedUseWaveConfig.mockReturnValue(
      createWaveConfigController("different-admin-group")
    );

    const { result } = renderHook(() =>
      useSubwaveWaveConfig({ parentAdminGroupId: "parent-admin-group" })
    );

    expect(result.current.config.groups.admin).toBe("different-admin-group");
  });

  it("leaves top-level wave configuration unchanged", () => {
    const controller = createWaveConfigController();
    mockedUseWaveConfig.mockReturnValue(controller);

    const { result } = renderHook(() =>
      useSubwaveWaveConfig({ parentAdminGroupId: null })
    );

    expect(result.current.config).toBe(controller.config);
    expect(mockedCommonApiFetch).not.toHaveBeenCalled();
  });
});
