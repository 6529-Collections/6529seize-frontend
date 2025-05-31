import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectSnapshotDropdown from "../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdown";
import { Pool } from "../../../components/allowlist-tool/allowlist-tool.types";

jest.mock("../../../components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper", () => ({ __esModule: true, default: (p: any) => <>{p.children}</> }));

jest.mock("../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/select-snapshot/SelectSnapshotDropdownList", () => (props: any) => (
  <button data-testid="option" onClick={() => props.setSelectedSnapshot(props.snapshots[0])} />
));

jest.mock("framer-motion", () => ({ motion: { div: (props: any) => <div {...props} /> }, useAnimate: () => [jest.fn(), jest.fn()] }));
jest.mock("react-use", () => ({ useClickAway: jest.fn(), useKeyPressEvent: jest.fn() }));

const snapshots = [{ id: "1", name: "Snap", poolType: Pool.TOKEN_POOL as const, walletsCount: 1 }];

test("opens dropdown and selects snapshot", async () => {
  const setSelected = jest.fn();
  render(<SelectSnapshotDropdown snapshots={snapshots} selectedSnapshot={null} setSelectedSnapshot={setSelected} />);

  await userEvent.click(screen.getByRole("button"));
  await userEvent.click(screen.getByTestId("option"));
  expect(setSelected).toHaveBeenCalledWith(snapshots[0]);
});
