import React, { Suspense, createRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import TabButton from "@/components/common/TabButton";

describe("TabButton", () => {
  it("shows pending feedback while preserving the committed selection", async () => {
    let ready = false;
    let resolveDestination: () => void = () => {
      throw new Error("Destination has not been initialized");
    };
    const destination = new Promise<void>((resolve) => {
      resolveDestination = resolve;
    });
    function Destination() {
      if (!ready) throw destination;
      return <p>New view</p>;
    }
    function Tabs() {
      const [selected, setSelected] = useState(false);
      return (
        <Suspense fallback={<p>Loading view</p>}>
          <TabButton
            role="tab"
            aria-selected={selected}
            aria-controls="destination"
            onClick={() => setSelected(true)}
          >
            Winners
          </TabButton>
          {selected ? <Destination /> : <p>Current view</p>}
        </Suspense>
      );
    }
    render(<Tabs />);
    const tab = screen.getByRole("tab", { name: "Winners" });

    fireEvent.click(tab);

    expect(tab).toHaveAttribute("aria-busy", "true");
    expect(tab).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Loading section…");
    expect(tab.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.getByText("Current view")).toBeInTheDocument();
    expect(screen.queryByText("Loading view")).not.toBeInTheDocument();

    await act(async () => {
      ready = true;
      resolveDestination();
      await destination;
    });

    expect(tab).not.toHaveAttribute("aria-busy", "true");
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(tab.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    expect(screen.getByText("New view")).toBeInTheDocument();
  });

  it("preserves the native button ref, attributes, and event", () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = jest.fn();
    render(
      <TabButton ref={ref} type="button" aria-current="true" onClick={onClick}>
        Chat
      </TabButton>
    );
    const button = screen.getByRole("button", { name: "Chat" });

    fireEvent.click(button);

    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-current", "true");
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].target).toBe(button);
  });

  it("clears pending feedback when a later choice supersedes a suspended view", () => {
    const destination = new Promise<void>(() => undefined);
    function Winners(): React.JSX.Element {
      throw destination;
    }
    function Tabs() {
      const [selected, setSelected] = useState("Chat");
      return (
        <Suspense fallback={<p>Loading view</p>}>
          {["Winners", "About"].map((tab) => (
            <TabButton
              key={tab}
              role="tab"
              aria-selected={selected === tab}
              onClick={() => setSelected(tab)}
            >
              {tab}
            </TabButton>
          ))}
          {selected === "Winners" ? <Winners /> : <p>{selected} view</p>}
        </Suspense>
      );
    }
    render(<Tabs />);
    const winners = screen.getByRole("tab", { name: "Winners" });
    const about = screen.getByRole("tab", { name: "About" });

    fireEvent.click(winners);
    expect(winners).toHaveAttribute("aria-busy", "true");
    fireEvent.click(about);

    expect(about).toHaveAttribute("aria-selected", "true");
    expect(winners).not.toHaveAttribute("aria-busy", "true");
    expect(about).not.toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("About view")).toBeInTheDocument();
  });

  it("preserves an externally supplied busy state and disabled behavior", () => {
    const onClick = jest.fn();
    render(
      <TabButton aria-busy="true" disabled onClick={onClick}>
        Outcome
      </TabButton>
    );
    const button = screen.getByRole("button", { name: "Outcome" });

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(onClick).not.toHaveBeenCalled();
  });
});
