import { render } from "@testing-library/react";
import CaseSafe from "@/components/explained/marks/CaseSafe";

describe("CaseSafe", () => {
  it("keeps commits, domains and rule names in their own case inside capitals", () => {
    const { container } = render(
      <p className="tw-uppercase">
        <CaseSafe text="Model at 7bf579a, Rust core and 6529.io under TDH-v1" />
      </p>
    );
    const kept = [...container.querySelectorAll("[data-tdh-case-safe]")].map(
      (element) => element.textContent
    );
    expect(kept).toEqual(["7bf579a", "6529.io", "TDH-v1"]);
    expect(container.textContent).toBe(
      "Model at 7bf579a, Rust core and 6529.io under TDH-v1"
    );
  });

  it("keeps a short part on one line and lets a full hash wrap", () => {
    const hash =
      "c7918b6d3275b8058401a166bf81f4880bbf072d11ce01b1525b21207cabb28d";
    const { container } = render(
      <CaseSafe text={`statements about TDH-v1 proved, file ${hash}`} />
    );
    const [rule, full] = [
      ...container.querySelectorAll("[data-tdh-case-safe]"),
    ] as HTMLElement[];
    expect(rule?.textContent).toBe("TDH-v1");
    expect(rule?.className).toContain("tw-whitespace-nowrap");
    expect(full?.textContent).toBe(hash);
    expect(full?.className).not.toContain("tw-whitespace-nowrap");
  });

  it("leaves plain words alone, hex-looking words with no digit included", () => {
    const { container } = render(<CaseSafe text="decided and accede" />);
    expect(container.querySelectorAll("[data-tdh-case-safe]")).toHaveLength(0);
  });
});
