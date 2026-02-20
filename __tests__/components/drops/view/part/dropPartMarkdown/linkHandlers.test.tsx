import React from "react";
import { render, screen } from "@testing-library/react";
import { createLinkRenderer } from "@/components/drops/view/part/dropPartMarkdown/linkHandlers";

const createLinkHandlers = jest.fn(() => [
  {
    match: () => true,
    render: () => <div data-testid="handled-link">handled</div>,
    display: "block",
  },
]);

const createSeizeHandlers = jest.fn(() => []);

jest.mock("@/components/drops/view/part/dropPartMarkdown/handlers", () => ({
  createLinkHandlers: (...args: any[]) => createLinkHandlers(...args),
  createSeizeHandlers: (...args: any[]) => createSeizeHandlers(...args),
}));

describe("createLinkRenderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});
