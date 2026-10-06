import { fireEvent, render, screen } from "@testing-library/react";
import type Link from "next/link";
import type { ComponentProps } from "react";
import WaveSubmissionAccessDetails from "@/components/waves/WaveSubmissionAccessDetails";
import { ApiWave } from "@/generated/models/ApiWave";
import type { ApiGroup } from "@/generated/models/ApiGroup";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onNavigate,
    prefetch: _prefetch,
    ...props
  }: ComponentProps<typeof Link>) => (
    <a
      href={href.toString()}
      {...props}
      onClick={(event) => {
        onNavigate?.({ preventDefault: () => event.preventDefault() });
      }}
    >
      {children}
    </a>
  ),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (uri: string) => uri,
  ImageScale: { W_AUTO_H_50: "50" },
}));

function makeWave(group: ApiGroup | null = null): ApiWave {
  return Object.assign(new ApiWave(), {
    id: "wave-1",
    participation: {
      scope: { group },
      signature_required: true,
    },
  });
}

describe("WaveSubmissionAccessDetails", () => {
  it("links inspectable submission groups and uses existing rules navigation", () => {
    const onViewRules = jest.fn();
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({
          id: "group /1",
          name: "Submission Club",
          is_hidden: false,
        })}
        onViewRules={onViewRules}
      />
    );
    expect(
      screen.getByRole("link", {
        name: "Inspect Submission Club group criteria and members",
      })
    ).toHaveAttribute("href", "/network?page=1&group=group%20%2F1");
    const rules = screen.getByRole("link", { name: "View submission rules" });
    expect(rules).toHaveAttribute("href", "/waves/wave-1?tab=configuration");
    fireEvent.click(rules);
    expect(onViewRules).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText("Chat access is separate from submission access.")
    ).toBeVisible();
    expect(
      screen.getByText("Submissions require a wallet signature.")
    ).toBeVisible();
  });

  it.each([
    { id: "secret-group", name: "Secret group name", is_hidden: true },
    {
      id: "secret-group",
      name: "Secret group name",
      is_hidden: false,
      is_direct_message: true,
    },
  ])(
    "withholds identifying metadata for private submission groups",
    (group) => {
      const { container } = render(
        <WaveSubmissionAccessDetails wave={makeWave(group)} />
      );
      expect(screen.getByText("Private group")).toBeVisible();
      expect(container.innerHTML).not.toContain("secret-group");
      expect(container.innerHTML).not.toContain("Secret group name");
      expect(screen.getAllByRole("link")).toHaveLength(1);
    }
  );

  it("does not describe an incomplete restricted group as public", () => {
    render(
      <WaveSubmissionAccessDetails
        wave={makeWave({ id: "missing-name", is_hidden: false })}
      />
    );
    expect(screen.getByText("Group unavailable")).toBeVisible();
    expect(screen.queryByText(/Public\./)).not.toBeInTheDocument();
  });

  it("does not imply that public group access overrides submission rules", () => {
    render(<WaveSubmissionAccessDetails wave={makeWave()} />);
    expect(
      screen.getByText("Public. Other submission rules still apply.")
    ).toBeVisible();
  });
});
