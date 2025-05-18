import { render } from "@testing-library/react";
import { ScrollPositionProvider } from "../contexts/ScrollPositionContext";
import { useVirtualizedWaves } from "../hooks/useVirtualizedWaves";
import React from "react";

function VirtualList({ items }: { items: number[] }) {
  const { containerRef, virtualItems, totalHeight } = useVirtualizedWaves(items, "test");
  return (
    <div ref={containerRef} style={{ height: 300, overflowY: "auto" }} data-testid="list">
      <div style={{ height: totalHeight, position: "relative" }}>
        {virtualItems.map((v) => (
          <div key={v.index} style={{ position: "absolute", top: v.start, height: v.size }} data-testid="row" />
        ))}
      </div>
    </div>
  );
}

test("virtualized waves renders limited rows", () => {
  const items = Array.from({ length: 1000 }, (_, i) => i);
  const { getAllByTestId } = render(
    <ScrollPositionProvider>
      <VirtualList items={items} />
    </ScrollPositionProvider>
  );
  const rows = getAllByTestId("row");
  expect(rows.length).toBeLessThanOrEqual(120);
});
