import { fireEvent, render, screen } from "@testing-library/react";
import CreateWaveRules from "@/components/waves/create-wave/CreateWaveRules";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/helpers/waves/wave-rules.helpers", () => ({
  buildWaveRules: jest.fn(() => []),
}));

jest.mock("@/components/waves/specs/WaveRulesPanel", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h3>{title}</h3>,
}));

jest.mock(
  "@/components/waves/create-wave/drops/terms/CreateWaveTermsOfService",
  () => ({
    __esModule: true,
    default: ({ setTerms }: { setTerms: (terms: string) => void }) => (
      <button type="button" onClick={() => setTerms("Binding rule")}>
        Rules that require acceptance
      </button>
    ),
  })
);

const getConfig = (type: ApiWaveType, customRules: string | null = null) =>
  ({
    overview: { type },
    display: { customRules },
    drops: { terms: null, signatureRequired: false },
  }) as any;

describe("CreateWaveRules", () => {
  it("keeps automatic rules visible and Chat creator rules in Advanced", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Chat)}
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Rules" })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 3, name: "Automatic rules" })
    ).toBeVisible();
    const advancedButton = screen.getByRole("button", {
      name: "Optional creator rules",
    });
    expect(advancedButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByLabelText("Display-only creator rules")
    ).not.toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Rules that require acceptance" })
    ).toBeNull();

    fireEvent.click(advancedButton);

    expect(screen.getByLabelText("Display-only creator rules")).toBeVisible();
  });

  it("includes acceptance rules for Rank waves and preserves their handler", () => {
    const setDrops = jest.fn();
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Rank)}
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={setDrops}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Optional creator rules and acceptance",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Rules that require acceptance" })
    );

    expect(setDrops).toHaveBeenCalledWith({
      terms: "Binding rule",
      signatureRequired: true,
    });
  });

  it("marks restored creator rules as Customized while collapsed", () => {
    render(
      <CreateWaveRules
        config={getConfig(ApiWaveType.Rank, "Restored rule")}
        groupsCache={{}}
        setDisplay={jest.fn()}
        setDrops={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", {
        name: /Optional creator rules and acceptance Customized/,
      })
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByDisplayValue("Restored rule")).not.toBeVisible();
  });
});
