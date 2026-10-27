import { closeDropInCurrentUrl } from "@/helpers/waves/close-drop.helpers";

it.each([
  "/waves/wave-1?drop=missing&tab=chat&competition=alpha#message",
  "/messages?wave=dm-1&drop=missing&view=following",
  "/alice?drop=missing",
])(
  "closes detail in place while retaining other URL and history state: %s",
  (path) => {
    const originalReplace = window.history.replaceState.bind(window.history);
    const previousState = { savedTab: "chat", __NA: true, tree: "previous" };
    originalReplace(previousState, "", path);
    const length = window.history.length;
    const target = new URL(window.location.href);
    target.searchParams.delete("drop");
    // Model Next's external update: it synchronizes URL hooks and replaces its
    // router tree, while the browser call drops unrelated application metadata.
    const replace = jest
      .spyOn(window.history, "replaceState")
      .mockImplementation((state, title, url) =>
        originalReplace(
          state === null ? { __NA: true, tree: "updated" } : state,
          title,
          url
        )
      );
    try {
      closeDropInCurrentUrl();
      expect(window.location.href).toBe(target.href);
      expect(window.history.length).toBe(length);
      expect(replace.mock.calls[0]?.[0]).toBeNull();
      expect(window.history.state).toEqual({
        savedTab: "chat",
        __NA: true,
        tree: "updated",
      });
    } finally {
      replace.mockRestore();
      originalReplace(null, "", "/");
    }
  }
);
