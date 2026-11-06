import AgentLoginClient from "@/app/tools/agent-login/page.client";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

const ADDRESS = "0x0000000000000000000000000000000000000529";
const PAYLOAD = JSON.stringify({
  account: { profileHandle: "agent" },
  session: {
    address: ADDRESS,
    role: null,
    accessToken: "agent-token",
    accessTokenExpiresAt: null,
  },
});

const setSecureContext = (value: boolean) => {
  Object.defineProperty(globalThis, "isSecureContext", {
    configurable: true,
    value,
  });
};

const applyPayload = () => {
  fireEvent.change(screen.getByLabelText("Login payload"), {
    target: { value: PAYLOAD },
  });
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
};

describe("AgentLoginClient", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
    Reflect.deleteProperty(globalThis, "isSecureContext");
  });

  it("hydrates without a console error when the textarea was modified before hydration", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(<AgentLoginClient />);
    const textarea = container.querySelector("textarea");
    // Something outside of React (a test harness or a browser extension) adds
    // an inline style to the server-rendered textarea before React hydrates it.
    textarea?.style.setProperty("caret-color", "transparent");
    const errorSpy = jest.spyOn(console, "error").mockImplementation();

    await act(async () => {
      hydrateRoot(container, <AgentLoginClient />);
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(container.querySelector("textarea")).toBe(textarea);
  });

  it("writes the prefixed session cookie with Secure and Path=/ in a secure context", () => {
    setSecureContext(true);
    const cookieWrites = jest.spyOn(document, "cookie", "set");
    render(<AgentLoginClient />);

    applyPayload();

    expect(cookieWrites).toHaveBeenCalledWith(
      "__Host-wallet-auth=agent-token; path=/; SameSite=Strict; Secure"
    );
    expect(localStorage.getItem("6529-wallet-active-address")).toBe(ADDRESS);
  });

  it("keeps the session client-side only where the browser cannot hold the cookie", () => {
    setSecureContext(false);
    const cookieWrites = jest.spyOn(document, "cookie", "set");
    render(<AgentLoginClient />);

    applyPayload();

    expect(cookieWrites).not.toHaveBeenCalled();
    expect(localStorage.getItem("6529-wallet-active-address")).toBe(ADDRESS);
  });
});
