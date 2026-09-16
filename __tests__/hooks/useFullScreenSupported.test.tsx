import { act, render } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { fullScreenSupported } from "@/helpers/Helpers";
import { useFullScreenSupported } from "@/hooks/useFullScreenSupported";

jest.mock("@/helpers/Helpers", () => ({ fullScreenSupported: jest.fn() }));

function Control() {
  return useFullScreenSupported() ? <button>Fullscreen</button> : null;
}

it("does not read browser capability in SSR and hydrates before revealing it", async () => {
  const capability = jest.mocked(fullScreenSupported);
  capability.mockReturnValue(true);
  const html = renderToString(<Control />);
  expect(html).toBe("");
  expect(capability).not.toHaveBeenCalled();
  const container = document.createElement("div");
  document.body.appendChild(container);
  container.innerHTML = html;
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, <Control />, { onRecoverableError });
  });
  expect(container.querySelector("button")).toHaveTextContent("Fullscreen");
  expect(onRecoverableError).not.toHaveBeenCalled();
  act(() => root!.unmount());
  container.remove();
});

it("keeps unsupported browsers free of fullscreen controls", () => {
  jest.mocked(fullScreenSupported).mockReturnValue(false);
  const { container } = render(<Control />);
  expect(container).toBeEmptyDOMElement();
});
