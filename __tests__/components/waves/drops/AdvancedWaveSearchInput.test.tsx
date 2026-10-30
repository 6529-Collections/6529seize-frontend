import AdvancedWaveSearchInput from "@/components/waves/drops/search/AdvancedWaveSearchInput";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchWaveSearchAuthors } from "@/services/api/wave-search-authors-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/services/api/wave-search-authors-api", () => ({
  fetchWaveSearchAuthors: jest.fn(),
}));
jest.mock("@/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: string) => value,
}));
const wave = { id: "wave-1", name: "Main Stage" } as ApiWave;
const author = { id: "author-1", handle: "alice", pfp: null };
const props = () => ({
  query: "",
  onQueryChange: jest.fn(),
  wave,
  onWaveChange: jest.fn(),
  author: null,
  onAuthorChange: jest.fn(),
  inputRef: createRef<HTMLInputElement>(),
  enabled: true,
  readContext: "viewer",
});
function mount(
  overrides: Partial<React.ComponentProps<typeof AdvancedWaveSearchInput>> = {}
) {
  const inputProps = { ...props(), ...overrides };
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AdvancedWaveSearchInput {...inputProps} />
    </QueryClientProvider>
  );
  return inputProps;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchWaveSearchAuthors).mockResolvedValue([author]);
});

it("renders removable wave and author chips inside the search control", () => {
  const callbacks = mount({ author });
  fireEvent.click(
    screen.getByRole("button", { name: "Remove wave filter Main Stage" })
  );
  expect(callbacks.onWaveChange).toHaveBeenCalledWith(null);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove author filter alice" })
  );
  expect(callbacks.onAuthorChange).toHaveBeenCalledWith(null);
});

it("chooses an author with the keyboard while preserving text", async () => {
  const callbacks = mount({ query: "hello from: ali" });
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  await screen.findByRole("option", { name: "@ alice" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(callbacks.onAuthorChange).toHaveBeenCalledWith(author);
  expect(callbacks.onQueryChange).toHaveBeenCalledWith("hello ");
  expect(fetchWaveSearchAuthors).toHaveBeenCalledWith(
    expect.objectContaining({ waveId: "wave-1", handle: "ali" })
  );
});

it("uses global profiles when the wave chip is removed", async () => {
  jest
    .mocked(commonApiFetch)
    .mockResolvedValue([{ profile_id: "author-2", handle: "bob", pfp: null }]);
  const callbacks = mount({ wave: null, query: "from: bob" });
  fireEvent.focus(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByRole("option", { name: "@ bob" }));
  expect(callbacks.onAuthorChange).toHaveBeenCalledWith({
    id: "author-2",
    handle: "bob",
    pfp: null,
  });
  expect(fetchWaveSearchAuthors).not.toHaveBeenCalled();
});

it("replaces the selected wave from autocomplete and Escape dismisses suggestions", async () => {
  const nextWave = { id: "wave-2", name: "Dev Alerts" } as ApiWave;
  jest.mocked(commonApiFetch).mockResolvedValue([nextWave]);
  const callbacks = mount({ query: "in: Dev" });
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  fireEvent.click(await screen.findByRole("option", { name: "# Dev Alerts" }));
  expect(callbacks.onWaveChange).toHaveBeenCalledWith(nextWave);
  expect(callbacks.onQueryChange).toHaveBeenCalledWith("");
  await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
});

it("keeps one combobox tab stop and starts a filter from keyboard hints", () => {
  const callbacks = mount();
  const input = screen.getByRole("combobox");
  input.focus();
  fireEvent.focus(input);
  const listbox = screen.getByRole("listbox", { name: "Search filters" });
  expect(input).toHaveAttribute("aria-controls", listbox.id);
  expect(input).toHaveAttribute("aria-expanded", "true");
  const activeOptionId = input.getAttribute("aria-activedescendant");
  expect(document.getElementById(activeOptionId!)).toHaveAttribute(
    "role",
    "option"
  );
  const hints = screen.getAllByRole("option");
  expect(hints).toHaveLength(2);
  hints.forEach((hint) => expect(hint).toHaveAttribute("tabindex", "-1"));
  fireEvent.keyDown(input, { key: "Enter" });
  expect(callbacks.onQueryChange).toHaveBeenCalledWith("from: ");
});

it("Backspace on an empty query removes the author first and retains input focus", () => {
  const callbacks = mount({ author });
  const input = screen.getByRole("combobox");
  input.focus();
  fireEvent.keyDown(input, { key: "Backspace" });
  expect(callbacks.onAuthorChange).toHaveBeenCalledWith(null);
  expect(callbacks.onWaveChange).not.toHaveBeenCalled();
  expect(input).toHaveFocus();
});

it("selects a suggestion when pointer focus would otherwise blur to no target", async () => {
  const callbacks = mount({ query: "from: ali" });
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  const option = await screen.findByRole("option", { name: "@ alice" });
  // Safari can blur the input without focusing the clicked button. Model that
  // default action only when the mousedown event has not been cancelled.
  if (fireEvent.mouseDown(option)) {
    fireEvent.blur(input, { relatedTarget: null });
  }
  fireEvent.mouseUp(option);
  fireEvent.click(option);
  expect(callbacks.onAuthorChange).toHaveBeenCalledWith(author);
  expect(input).toHaveFocus();
});
