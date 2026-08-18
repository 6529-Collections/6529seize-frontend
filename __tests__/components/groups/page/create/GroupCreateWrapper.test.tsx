import { render } from "@testing-library/react";
import React from "react";
import GroupCreateWrapper from "@/components/groups/page/create/GroupCreateWrapper";

describe("GroupCreateWrapper", () => {
  it("renders children inside wrapper with correct classes", () => {
    const { container } = render(
      <GroupCreateWrapper>
        <span>content</span>
      </GroupCreateWrapper>
    );

    const outer = container.firstElementChild as HTMLElement;
    expect(outer.tagName).toBe("DIV");
    expect(outer.className).toContain("tw-mt-4");
    expect(outer.className).toContain("lg:tw-mt-6");
    expect(outer.className).toContain("tailwind-scope");
    expect(outer.className).toContain("tw-relative");
    expect(outer.className).toContain(
      "[&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=button]):not([type=submit])]:!tw-h-12"
    );
    expect(outer.className).toContain(
      "[&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=button]):not([type=submit])]:!tw-bg-iron-900"
    );
    expect(outer.className).toContain(
      "[&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=button]):not([type=submit])]:!tw-py-3"
    );
    expect(outer.className).toContain(
      "[&_input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]):not([type=button]):not([type=submit])]:!tw-ring-iron-800"
    );

    const inner = outer.firstElementChild as HTMLElement;
    expect(inner.tagName).toBe("DIV");
    expect(inner.textContent).toBe("content");
  });
});
