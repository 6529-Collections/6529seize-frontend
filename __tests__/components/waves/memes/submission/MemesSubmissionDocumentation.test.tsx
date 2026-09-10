import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef, type ComponentProps } from "react";
import type {
  ArtworkDocumentationInlineHandle,
  ArtworkDocumentationInline,
} from "@/components/artwork-documentation/ArtworkDocumentationInline";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import MemesSubmissionDocumentation, {
  type MemesSubmissionDocumentationHandle,
} from "@/components/waves/memes/submission/MemesSubmissionDocumentation";

const mockLink = jest.fn();
const mockFlush = jest.fn();
const mockAccess = jest.fn();
const mockMounted = jest.fn();
let mockDeferHandle = false;
jest.mock(
  "@/hooks/artwork-documentation/useArtworkDocumentationAccess",
  () => ({ useArtworkDocumentationAccess: () => mockAccess() })
);
jest.mock(
  "@/components/artwork-documentation/ArtworkDocumentationInline",
  () => {
    const React = jest.requireActual<typeof import("react")>("react");
    const ReadyEditor = React.forwardRef<ArtworkDocumentationInlineHandle>(
      function ReadyEditor(_props, ref) {
        React.useImperativeHandle(ref, () => ({
          onDropSubmitted: mockLink,
          flush: mockFlush,
        }));
        return null;
      }
    );
    return {
      __esModule: true,
      ArtworkDocumentationInline: React.forwardRef<
        ArtworkDocumentationInlineHandle,
        ComponentProps<typeof ArtworkDocumentationInline>
      >(function Inline(props, ref) {
        const [editorReady, setEditorReady] = React.useState(!mockDeferHandle);
        React.useEffect(() => {
          mockMounted();
        }, []);
        return (
          <>
            <button
              onClick={() => {
                props.onContextCreated?.({
                  id: "context",
                  work_id: "work",
                } as ApiArtworkDocumentationContext);
                setEditorReady(true);
              }}
            >
              Start test documentation
            </button>
            {editorReady && <ReadyEditor ref={ref} />}
          </>
        );
      }),
    };
  }
);

const props = {
  waveId: "wave",
  title: "Work",
  description: "Caption",
  visible: true,
  onStarted: jest.fn(),
  onDiscardClose: jest.fn(),
};
beforeEach(() => {
  jest.clearAllMocks();
  mockDeferHandle = false;
  mockAccess.mockReturnValue({
    enabled: true,
    selfServiceEnabled: false,
    profiles: [
      {
        profile_id: "keys_and_gates_v1",
        version: 1,
        program_id: "program",
        wave_id: "wave",
      },
    ],
  });
  mockFlush.mockResolvedValue(true);
  mockLink.mockResolvedValue({
    linked: true,
    contextId: "context",
    workId: "work",
  });
});

it("links a successful drop independently, including when the context finishes creating afterward", async () => {
  mockDeferHandle = true;
  const ref = createRef<MemesSubmissionDocumentationHandle>();
  render(<MemesSubmissionDocumentation {...props} ref={ref} />);
  act(() => ref.current?.onDropSubmitted("submitted-drop"));
  expect(mockLink).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Start test documentation" })
  );
  await waitFor(() => expect(mockLink).toHaveBeenCalledWith("submitted-drop"));
  expect(mockLink).toHaveBeenCalledTimes(1);
  expect(await screen.findByRole("status")).toHaveTextContent(
    "submitted and linked"
  );
});

it("retries only the documentation link after a recoverable failure", async () => {
  mockLink.mockResolvedValueOnce({
    linked: false,
    contextId: "context",
    workId: "work",
  });
  const ref = createRef<MemesSubmissionDocumentationHandle>();
  render(<MemesSubmissionDocumentation {...props} ref={ref} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Start test documentation" })
  );
  act(() => ref.current?.onDropSubmitted("submitted-drop"));
  const retry = await screen.findByRole("button", {
    name: "Retry documentation link",
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    "Do not submit the artwork again"
  );
  fireEvent.click(retry);
  await waitFor(() => expect(mockLink).toHaveBeenCalledTimes(2));
  expect(mockLink.mock.calls.map(([dropId]) => dropId)).toEqual([
    "submitted-drop",
    "submitted-drop",
  ]);
  expect(props.onStarted).toHaveBeenCalledTimes(1);
});

it("retains the editor across submission step visibility changes", () => {
  const { rerender } = render(<MemesSubmissionDocumentation {...props} />);
  rerender(<MemesSubmissionDocumentation {...props} visible={false} />);
  rerender(<MemesSubmissionDocumentation {...props} visible />);
  expect(mockMounted).toHaveBeenCalledTimes(1);
});

it("keeps the window open on save failure and offers explicit discard", async () => {
  mockFlush.mockRejectedValue(new Error("offline"));
  const ref = createRef<MemesSubmissionDocumentationHandle>();
  render(<MemesSubmissionDocumentation {...props} ref={ref} />);
  let saved: boolean | undefined;
  await act(async () => {
    saved = await ref.current?.prepareClose();
  });
  expect(saved).toBe(false);
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  fireEvent.click(
    screen.getByRole("button", { name: "Discard unsaved changes and close" })
  );
  expect(props.onDiscardClose).toHaveBeenCalledTimes(1);
});

it("omits unsupported waves until self service is enabled", () => {
  render(<MemesSubmissionDocumentation {...props} waveId="other-wave" />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
