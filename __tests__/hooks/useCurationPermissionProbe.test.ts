import { renderHook } from "@testing-library/react";
import { useCurationPermissionProbe } from "@/hooks/useCurationPermissionProbe";

it("clears a previous Curation probe before placeholder drops are replaced", () => {
  const { result, rerender } = renderHook(
    ({
      curationId,
      drops,
      isPlaceholderData,
    }: {
      curationId: string;
      drops: { id: string }[];
      isPlaceholderData: boolean;
    }) => useCurationPermissionProbe(curationId, drops, isPlaceholderData),
    {
      initialProps: {
        curationId: "one",
        drops: [{ id: "one-a" }],
        isPlaceholderData: false,
      },
    }
  );
  expect(result.current).toBe("one-a");

  rerender({
    curationId: "two",
    drops: [{ id: "one-a" }],
    isPlaceholderData: true,
  });
  expect(result.current).toBe("");

  rerender({
    curationId: "two",
    drops: [{ id: "two-a" }],
    isPlaceholderData: false,
  });
  expect(result.current).toBe("two-a");
});

it("replaces a probe that is no longer in the Curation", () => {
  const { result, rerender } = renderHook(
    ({ drops }: { drops: { id: string }[] }) =>
      useCurationPermissionProbe("curation", drops),
    { initialProps: { drops: [{ id: "a" }, { id: "b" }] } }
  );
  expect(result.current).toBe("a");

  rerender({ drops: [{ id: "b" }] });
  expect(result.current).toBe("b");
});
