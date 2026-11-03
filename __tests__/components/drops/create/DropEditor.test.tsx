import React, { createRef } from "react";
import { render, screen, act } from "@testing-library/react";
import DropEditor from "@/components/drops/create/DropEditor";
import { CreateDropDraftContext } from "@/components/drops/create/CreateDropDraftContext";
import type { CreateDropConfig } from "@/entities/IDrop";
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
        {props.children}
      </div>
    );
  });
});

jest.mock("@/components/drops/create/utils/storm/CreateDropStormView", () => ({
  __esModule: true,
  default: (props: {
    drop: CreateDropConfig;
    removePart: (index: number) => void;
  }) => (
    <div data-testid="storm-parts">
      {props.drop.parts.map((part, index) => (
        <button key={part.clientId} onClick={() => props.removePart(index)}>
          {part.content}
        </button>
      ))}
    </div>
  ),
}));

function setup(
  refreshKey = 0,
  loading = false,
  props: Partial<React.ComponentProps<typeof DropEditor>> = {},
  initialDrop: CreateDropConfig | null = null
) {
  const ref = createRef<any>();
  const profile = { handle: "user" } as any;
  render(
    <CreateDropDraftContext.Provider
      value={
        initialDrop
          ? {
              initialDrop,
              onChange: jest.fn(),
              label: "First post",
              errorId: "error",
              invalid: false,
              autoFocus: false,
            }
          : null
      }
    >
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
    </CreateDropDraftContext.Provider>
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

test("restored multipart drafts expose earlier parts and allow removal", () => {
  const draft: CreateDropConfig = {
    title: null,
    parts: [
      { content: "Earlier restored part", media: [], quoted_drop: null },
      { content: "Current part", media: [], quoted_drop: null },
    ],
    metadata: [],
    mentioned_users: [],
    mentioned_waves: [],
    referenced_nfts: [],
    signature: null,
  };
  setup(0, false, {}, draft);
  expect(screen.getByTestId("storm-parts")).toHaveTextContent(
    "Earlier restored part"
  );
  expect(mockWrapperProps.drop.parts[0].clientId).toBeTruthy();
  act(() =>
    screen.getByRole("button", { name: "Earlier restored part" }).click()
  );
  expect(screen.queryByTestId("storm-parts")).not.toBeInTheDocument();
  expect(mockWrapperProps.drop.parts).toEqual([]);
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
