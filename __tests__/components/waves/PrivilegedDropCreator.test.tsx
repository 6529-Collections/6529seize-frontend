import { render, screen } from "@testing-library/react";
import React from "react";
import PrivilegedDropCreator, {
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useDropPrivileges } from "@/hooks/useDropPriviledges";

const mockInvalidateQueries = jest.fn(() => Promise.resolve());

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));
jest.mock("@/hooks/useDropPriviledges", () => ({
  useDropPrivileges: jest.fn(),
  ChatRestriction: { SLOW_MODE: "SLOW_MODE" },
}));
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => ({}) }));
jest.mock("@/components/waves/DropPlaceholder", () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="placeholder" data-type={props.type} />
  ),
}));
jest.mock("@/components/waves/CreateDrop", () => ({
  __esModule: true,
  default: () => <div data-testid="create" />,
}));

const mockPriv = useDropPrivileges as jest.Mock;
const wave: any = {
  id: "wave-1",
  chat: { authenticated_user_eligible: true, enabled: true },
  participation: { authenticated_user_eligible: true },
  metrics: {},
};

describe("PrivilegedDropCreator", () => {
  beforeEach(() => {
    mockPriv.mockReset();
    mockInvalidateQueries.mockClear();
  });

  it("shows both placeholder when both restricted", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: "SUB",
      chatRestriction: "CHAT",
    });
    render(
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.BOTH}
      />
    );
    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "data-type",
      "both"
    );
  });

  it("shows chat placeholder when chat restricted", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: "CHAT",
    });
    render(
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.CHAT}
      />
    );
    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "data-type",
      "chat"
    );
  });

  it("shows submission placeholder when submission restricted", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: "SUB",
      chatRestriction: null,
    });
    render(
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.PARTICIPATION}
      />
    );
    expect(screen.getByTestId("placeholder")).toHaveAttribute(
      "data-type",
      "submission"
    );
  });

  it("renders CreateDrop when allowed", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: null,
    });
    render(
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.BOTH}
      />
    );
    expect(screen.getByTestId("create")).toBeInTheDocument();
  });

  it("keeps chat composer visible during slow mode cooldown", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: "SLOW_MODE",
    });
    render(
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.CHAT}
      />
    );
    expect(screen.getByTestId("create")).toBeInTheDocument();
    expect(screen.queryByTestId("placeholder")).not.toBeInTheDocument();
  });

  it("invalidates the wave when the slow mode expiry callback fires", () => {
    mockPriv.mockReturnValue({
      submissionRestriction: null,
      chatRestriction: null,
    });
    render(
      <PrivilegedDropCreator
        activeDrop={null}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        wave={wave}
        dropId={null}
        fixedDropMode={DropMode.CHAT}
      />
    );

    const privilegesInput = mockPriv.mock.calls[0][0];
    privilegesInput.onSlowModeCooldownExpired();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "wave-1" }],
    });
  });
});
