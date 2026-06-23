import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type DependencyList, type ReactNode } from "react";
import CreateWaveGroupSearchField from "@/components/waves/create-wave/groups/CreateWaveGroupSearchField";
import type { CreateWaveGroupSearchResultsLayout } from "@/components/waves/create-wave/groups/CreateWaveGroupSearchResults";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("framer-motion", () => {
  const React = require("react");

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    LazyMotion: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    domAnimation: {},
    m: {
      div: (props: any) => {
        const nextProps = { ...props };
        const { children } = nextProps;
        delete nextProps.animate;
        delete nextProps.children;
        delete nextProps.exit;
        delete nextProps.initial;
        delete nextProps.transition;

        return React.createElement("div", nextProps, children);
      },
    },
  };
});

jest.mock("react-use", () => {
  const React = require("react");
  const actual = jest.requireActual("react-use");

  return {
    ...actual,
    useDebounce: (
      callback: () => void,
      _delay: number,
      deps: DependencyList
    ) => {
      React.useEffect(callback, deps);
    },
  };
});

const groups: ApiGroupFull[] = [
  {
    id: "group-1",
    name: "Alpha Group",
    created_by: { handle: "alice" },
  } as ApiGroupFull,
  {
    id: "group-2",
    name: "Beta Group",
    created_by: { handle: "builder" },
  } as ApiGroupFull,
];

const mockCommonApiFetch = commonApiFetch as jest.Mock;

function renderSearchField({
  defaultLabel = "Anyone",
  disabled = false,
  selectedGroup = null,
  allowClear = true,
  resultsLayout = "popover",
  onSelect = jest.fn(),
}: {
  readonly defaultLabel?: string;
  readonly disabled?: boolean;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly allowClear?: boolean;
  readonly resultsLayout?: CreateWaveGroupSearchResultsLayout;
  readonly onSelect?: jest.Mock;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <CreateWaveGroupSearchField
        label="Search groups..."
        defaultLabel={defaultLabel}
        disabled={disabled}
        selectedGroup={selectedGroup}
        allowClear={allowClear}
        resultsLayout={resultsLayout}
        onSelect={onSelect}
      />
    </QueryClientProvider>
  );

  return { onSelect };
}

function renderStatefulSearchField({
  defaultLabel = "Anyone",
  disabled = false,
  selectedGroup = null,
  allowClear = true,
  onSelect = jest.fn(),
}: {
  readonly defaultLabel?: string;
  readonly disabled?: boolean;
  readonly selectedGroup?: ApiGroupFull | null;
  readonly allowClear?: boolean;
  readonly onSelect?: jest.Mock;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function StatefulSearchField() {
    const [currentSelectedGroup, setCurrentSelectedGroup] =
      useState<ApiGroupFull | null>(selectedGroup);

    return (
      <CreateWaveGroupSearchField
        label="Search groups..."
        defaultLabel={defaultLabel}
        disabled={disabled}
        selectedGroup={currentSelectedGroup}
        allowClear={allowClear}
        onSelect={(group) => {
          setCurrentSelectedGroup(group);
          onSelect(group);
        }}
      />
    );
  }

  render(
    <QueryClientProvider client={queryClient}>
      <StatefulSearchField />
    </QueryClientProvider>
  );

  return { onSelect };
}

describe("CreateWaveGroupSearchField", () => {
  beforeEach(() => {
    mockCommonApiFetch.mockResolvedValue(groups);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("opens on focus, renders results, and selects with keyboard", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSearchField();

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(
      await screen.findByRole("option", { name: /Alpha Group/i })
    ).toBeInTheDocument();

    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(groups[0]));
    expect(input).toHaveValue("Alpha Group");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("renders inline results without absolute popover wrappers and keeps keyboard selection", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSearchField({ resultsLayout: "inline" });

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);

    const listbox = await screen.findByRole("listbox");
    const panel = listbox.parentElement?.parentElement;
    const wrapper = panel?.parentElement;

    expect(wrapper).toHaveClass("tw-mt-1.5");
    expect(wrapper).not.toHaveClass("tw-absolute");
    expect(panel).not.toHaveClass("tw-absolute");

    await user.keyboard("{ArrowDown}{Enter}");

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(groups[0]));
  });

  it("uses the debounced search value for group queries", async () => {
    const user = userEvent.setup();
    mockCommonApiFetch.mockImplementation(async ({ params }: any) =>
      params.group_name === "missing" ? [] : groups
    );
    renderSearchField();

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);
    await screen.findByRole("option", { name: /Alpha Group/i });

    await user.clear(input);
    await user.type(input, "missing");

    await waitFor(() =>
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "groups",
        params: { group_name: "missing" },
      })
    );
    expect(await screen.findByText("No groups found")).toBeInTheDocument();
  });

  it("highlights literal search matches case-insensitively", async () => {
    const user = userEvent.setup();
    mockCommonApiFetch.mockResolvedValue([
      {
        id: "group-literal",
        name: "A.a A.A Group",
        created_by: { handle: "literal-owner" },
      } as ApiGroupFull,
    ]);
    renderSearchField();

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);
    await user.type(input, "a.a");

    const option = await screen.findByRole("option", {
      name: /A\.a A\.A Group/i,
    });

    await waitFor(() => {
      const highlightedParts = Array.from(
        option.querySelectorAll(".tw-text-primary-300")
      ).map((element) => element.textContent);

      expect(highlightedParts).toEqual(["A.a", "A.A"]);
    });
  });

  it("renders the selected group as the initial input value", () => {
    renderSearchField({ selectedGroup: groups[0] });

    expect(
      screen.getByRole("combobox", { name: "Search groups..." })
    ).toHaveValue("Alpha Group");
    expect(screen.getByText("Current group: Alpha Group")).toBeInTheDocument();
  });

  it("syncs input and search query when selected group changes externally", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const renderField = (selectedGroup: ApiGroupFull | null) => (
      <QueryClientProvider client={queryClient}>
        <CreateWaveGroupSearchField
          label="Search groups..."
          defaultLabel="Anyone"
          disabled={false}
          selectedGroup={selectedGroup}
          onSelect={onSelect}
        />
      </QueryClientProvider>
    );

    const { rerender } = render(renderField(groups[0]));
    const input = screen.getByRole("combobox", { name: "Search groups..." });

    expect(input).toHaveValue("Alpha Group");

    rerender(renderField(groups[1]));

    expect(input).toHaveValue("Beta Group");
    expect(screen.getByText("Current group: Beta Group")).toBeInTheDocument();

    await user.click(input);

    await waitFor(() =>
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "groups",
        params: { group_name: "Beta Group" },
      })
    );

    rerender(renderField(null));

    await waitFor(() => expect(input).toHaveValue(""));
    expect(screen.getByText("Current group: Anyone")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "groups",
        params: {},
      })
    );
  });

  it("keeps the current group while preserving typed search text", async () => {
    const { onSelect } = renderStatefulSearchField({
      selectedGroup: groups[0],
    });

    const input = screen.getByRole("combobox", { name: "Search groups..." });

    fireEvent.change(input, { target: { value: "Custom query" } });

    expect(onSelect).not.toHaveBeenCalledWith(null);
    await waitFor(() => expect(input).toHaveValue("Custom query"));
    expect(screen.getByText("Current group: Alpha Group")).toBeInTheDocument();
  });

  it("restores selected group text when Escape dismisses an unselected query", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderStatefulSearchField({
      selectedGroup: groups[0],
    });

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "Custom query");

    expect(input).toHaveValue("Custom query");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(input).toHaveValue("Alpha Group"));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("restores selected group text when outside click dismisses an unselected query", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderStatefulSearchField({
      selectedGroup: groups[0],
    });

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);
    await user.clear(input);
    await user.type(input, "Custom query");

    expect(input).toHaveValue("Custom query");

    await user.click(document.body);

    await waitFor(() => expect(input).toHaveValue("Alpha Group"));
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes the results on Escape and outside click", async () => {
    const user = userEvent.setup();
    renderSearchField();

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);
    await user.type(input, "a");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    const stopPropagationSpy = jest.spyOn(Event.prototype, "stopPropagation");
    try {
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
      expect(stopPropagationSpy).toHaveBeenCalled();
    } finally {
      stopPropagationSpy.mockRestore();
    }

    await user.click(input);
    await user.type(input, "a");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();

    await user.click(document.body);
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  });

  it("only clears the selected group when clearing is allowed", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderSearchField({ selectedGroup: groups[0] });

    await user.click(
      screen.getByRole("button", { name: "Clear selected group" })
    );

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("hides clear action when clearing is disabled", () => {
    renderSearchField({ selectedGroup: groups[0], allowClear: false });

    expect(
      screen.queryByRole("button", { name: "Clear selected group" })
    ).not.toBeInTheDocument();
  });

  it("does not open or query while disabled", async () => {
    const user = userEvent.setup();
    renderSearchField({ disabled: true });

    const input = screen.getByRole("combobox", { name: "Search groups..." });
    await user.click(input);

    expect(input).toBeDisabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
  });
});
