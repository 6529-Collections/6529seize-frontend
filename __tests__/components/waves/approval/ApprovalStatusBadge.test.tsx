import { render, screen } from "@testing-library/react";
import React from "react";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";

describe("ApprovalStatusBadge", () => {
  it("renders approved text without an approval number", () => {
    render(<ApprovalStatusBadge approvedAt={1000} />);

    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.queryByText("Approved #1")).toBeNull();
    expect(
      screen.getByTitle("Approved on 1970-01-01T00:00:01.000Z")
    ).toBeInTheDocument();
  });
});
