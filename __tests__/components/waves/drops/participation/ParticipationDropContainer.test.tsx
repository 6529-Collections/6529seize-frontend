import { render, screen } from "@testing-library/react";
import ParticipationDropContainer from "@/components/waves/drops/participation/ParticipationDropContainer";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropLocation } from "@/components/waves/drops/drop.types";

const baseDrop = { drop_type: ApiDropType.Participatory, rank: 1 } as any;

const getShell = (container: HTMLElement): HTMLElement => {
  const shell = container.querySelector(".tw-group.tw-relative");
  expect(shell).not.toBeNull();
  return shell as HTMLElement;
};

const getClippedCard = (shell: HTMLElement): HTMLElement => {
  const clippedCard = shell.querySelector(".tw-overflow-hidden");
  expect(clippedCard).not.toBeNull();
  return clippedCard as HTMLElement;
};

test("renders floating actions outside the clipped card", () => {
  const { container } = render(
    <ParticipationDropContainer
      drop={baseDrop}
      isActiveDrop={false}
      location={DropLocation.WAVE}
      floatingActions={<div data-testid="floating-actions" />}
    >
      <div data-testid="child" />
    </ParticipationDropContainer>
  );

  const shell = getShell(container);
  const clippedCard = getClippedCard(shell);
  const floatingActions = screen.getByTestId("floating-actions");
  const child = screen.getByTestId("child");

  expect(shell.className).toContain("tw-group");
  expect(shell.className).toContain("tw-relative");
  expect(shell.className).not.toContain("tw-overflow-hidden");
  expect(clippedCard.className).toContain("tw-overflow-hidden");
  expect(clippedCard.className).toContain("tw-rounded-xl");
  expect(shell.contains(floatingActions)).toBe(true);
  expect(clippedCard.contains(floatingActions)).toBe(false);
  expect(clippedCard.contains(child)).toBe(true);
});

test("keeps active styles on the clipped card", () => {
  const { container } = render(
    <ParticipationDropContainer
      drop={baseDrop}
      isActiveDrop={true}
      location={DropLocation.WAVE}
    >
      <div />
    </ParticipationDropContainer>
  );

  const clippedCard = getClippedCard(getShell(container));

  expect(clippedCard.className).toContain("tw-bg-[#3CCB7F]/10");
  expect(clippedCard.className).toContain("tw-border-[#3CCB7F]/45");
  expect(clippedCard.className).toContain(
    "tw-shadow-[0_0_0_1px_rgba(60,203,127,0.14)]"
  );
  expect(clippedCard.className).toContain("tw-border-solid");
});

test("keeps inactive rank and background styles on the clipped card", () => {
  const { container } = render(
    <ParticipationDropContainer
      drop={baseDrop}
      isActiveDrop={false}
      location={DropLocation.MY_STREAM}
    >
      <div />
    </ParticipationDropContainer>
  );

  const clippedCard = getClippedCard(getShell(container));

  expect(clippedCard.className).toContain("tw-bg-iron-950");
  expect(clippedCard.className).toContain("tw-border-iron-800");
  expect(clippedCard.className).toContain(
    "desktop-hover:hover:tw-border-amber-500/20"
  );
});
