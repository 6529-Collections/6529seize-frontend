import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropContent from "@/components/waves/CreateDropContent";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

const mockInsertTextAtCursor = jest.fn();
const mockInsertImagePreviewFromUrl = jest.fn();
const mockFocus = jest.fn();
const mockSubmitDrop = jest.fn();
const mockSend = jest.fn();

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock("react-redux", () => ({
  useSelector: () => null,
}));

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    __esModule: true,
    motion: {
      div: React.forwardRef(function Div(
        { children, ...props }: { children: React.ReactNode },
        ref: React.Ref<HTMLDivElement>
      ) {
        return React.createElement("div", { ...props, ref }, children);
      }),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/components/waves/CreateDropActions", () => ({
  __esModule: true,
  default: (props: any) => (
    <button
      data-testid="select-gif"
      onClick={() => {
        props.onGifDrop("https://media.tenor.com/abc/tenor.gif");
      }}
    >
      Select GIF
    </button>
  ),
}));

jest.mock("@/components/waves/CreateDropInput", () => {
  const React = require("react");
  return React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      clearEditorState: jest.fn(),
      insertTextAtCursor: mockInsertTextAtCursor,
      insertImagePreviewFromUrl: mockInsertImagePreviewFromUrl,
      focus: mockFocus,
    }));
    return <div data-testid="create-drop-input" />;
  });
});

jest.mock("@/components/waves/CreateDropReplyingWrapper", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("@/components/waves/CreateDropMetadata", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("@/components/waves/CreateDropContentRequirements", () => ({
  __esModule: true,
  default: () => <div />,
}));

jest.mock("@/components/waves/CreateDropContentFiles", () => ({
  __esModule: true,
  CreateDropContentFiles: () => <div />,
}));

jest.mock("@/components/waves/CreateDropDropModeToggle", () => ({
  __esModule: true,
  CreateDropDropModeToggle: () => <div />,
}));

jest.mock("@/components/waves/CreateDropSubmit", () => ({
  __esModule: true,
  CreateDropSubmit: () => <div />,
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  __esModule: true,
  useMyStream: () => ({ processIncomingDrop: jest.fn() }),
}));

jest.mock("@/hooks/drops/useDropSignature", () => ({
  __esModule: true,
  useDropSignature: () => ({ signDrop: jest.fn() }),
}));

jest.mock("@/hooks/useWave", () => ({
  __esModule: true,
  useWave: () => ({ isMemesWave: false }),
}));

jest.mock("@/services/websocket", () => ({
  __esModule: true,
  useWebSocket: () => ({ send: mockSend }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  __esModule: true,
  useSeizeConnectContext: () => ({
    isSafeWallet: false,
    address: null,
  }),
}));

jest.mock("@/components/waves/hooks/useDropMetadata", () => ({
  __esModule: true,
  generateMetadataId: () => "metadata-id",
  useDropMetadata: () => ({
    metadata: [],
    setMetadata: jest.fn(),
    initialMetadata: [],
  }),
}));

describe("CreateDropContent GIF insert behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("inserts selected GIF URL into editor and does not submit immediately", async () => {
    const wave = {
      id: "wave-1",
      wave: { type: ApiWaveType.Chat },
      chat: { enabled: true },
      participation: {
        required_metadata: [],
        required_media: [],
        signature_required: false,
        terms: null,
      },
    } as any;

    render(
      <CreateDropContent
        activeDrop={null}
        onCancelReplyQuote={jest.fn()}
        wave={wave}
        drop={null}
        isStormMode={false}
        isDropMode={false}
        dropId={null}
        setDrop={jest.fn()}
        setIsStormMode={jest.fn()}
        onDropModeChange={jest.fn()}
        submitDrop={mockSubmitDrop}
        privileges={{} as any}
      />
    );

    await userEvent.click(screen.getByTestId("select-gif"));

    expect(mockInsertImagePreviewFromUrl).toHaveBeenCalledWith(
      "https://media.tenor.com/abc/tenor.gif",
      { smartSpacing: true }
    );
    expect(mockFocus).toHaveBeenCalled();
    expect(mockSubmitDrop).not.toHaveBeenCalled();
  });
});
