import { getSafeCssColor } from "@/helpers/css-color.helpers";

describe("getSafeCssColor", () => {
  it.each([
    "#abc",
    "#abcd",
    "#1f2937",
    "#1F2937AA",
    "rgb(1, 2, 3)",
    "rgba(1, 2, 3, 0.5)",
    "rgb(10% 20% 30% / 50%)",
    "hsl(210, 40%, 20%)",
    "hsla(210deg, 40%, 20%, .4)",
    "hsl(0.5turn 40% 20%)",
  ])("accepts %s", (value) => {
    expect(getSafeCssColor(value)).toBe(value);
  });

  it("trims surrounding whitespace", () => {
    expect(getSafeCssColor("  #123456 ")).toBe("#123456");
  });

  it.each([
    "red",
    "#12345",
    "#1234567",
    "#123456; position: fixed",
    "#123456}body{display:none",
    "url(https://example.com/a.png)",
    "rgb(1, 2, 3); background-image: url(x)",
    "rgb(var(--x), 2, 3)",
    "expression(alert(1))",
    "linear-gradient(red, blue)",
    "var(--accent)",
    "rgb(1 2)",
    "",
    null,
    undefined,
  ])("refuses %j", (value) => {
    expect(getSafeCssColor(value)).toBeNull();
  });
});
