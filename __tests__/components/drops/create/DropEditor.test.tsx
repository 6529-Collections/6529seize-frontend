import React, { createRef } from "react";
import { render, screen, act } from "@testing-library/react";
import DropEditor from "@/components/drops/create/DropEditor";
import {
  CreateDropType,
  CreateDropViewType,
} from "@/components/drops/create/types";

let mockWrapperProps: any = null;

jest.mock("@/components/drops/create/utils/CreateDropWrapper", () => {
  return React.forwardRef((props: any, ref: any) => {
    mockWrapperProps = props;
    React.useImperativeHandle(ref, () => ({
      getDropSnapshot: () => ({ id: "snapshot" }),
      requestDrop: () => ({ id: "drop" }),
    }));
    return (
      <div data-testid="wrapper">
        {JSON.stringify({ drop: props.drop, viewType: props.viewType })}
      </div>
    );
  });
});

function setup(
  refreshKey = 0,
  loading = false,
  props: Partial<React.ComponentProps<typeof DropEditor>> = {}
) {
  const ref = createRef<any>();
  const profile = { handle: "user" } as any;
  render(
    <DropEditor
      ref={ref}
      profile={profile}
      quotedDrop={null}
      type={CreateDropType.DROP}
      loading={loading}
      dropEditorRefreshKey={refreshKey}
      wave={null}
      waveId={null}
      onSubmitDrop={jest.fn()}
      {...props}
    />
  );
  return ref;
}

test("exposes requestDrop via ref", () => {
  const ref = setup();
  expect(ref.current?.requestDrop()).toEqual({ id: "drop" });
});

test("exposes getDropSnapshot via ref", () => {
  const ref = setup();
  expect(ref.current?.getDropSnapshot()).toEqual({ id: "snapshot" });
});

test("passes loading lock to create drop wrapper", () => {
  setup(0, true);
  expect(mockWrapperProps.loading).toBe(true);
});

test("defaults submitOnEnter to true", () => {
  setup();
  expect(mockWrapperProps.submitOnEnter).toBe(true);
});

test("passes explicit submitOnEnter override to create drop wrapper", () => {
  setup(0, false, { submitOnEnter: false });
  expect(mockWrapperProps.submitOnEnter).toBe(false);
});

test("resets state when refresh key changes", () => {
  const ref1 = setup(0);
  act(() => {
    ref1.current?.requestDrop();
  });
  setup(1);
  const wrappers = screen.getAllByTestId("wrapper");
  const last = wrappers[wrappers.length - 1];
  expect(last).toHaveTextContent('"drop":null');
  expect(last).toHaveTextContent(`"viewType":"${CreateDropViewType.COMPACT}"`);
});
