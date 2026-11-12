import AccessPage from "@/app/access/page.client";
import { API_AUTH_COOKIE } from "@/constants/constants";
import { resumeAfterApiAccess } from "@/services/auth/api-access-redirect";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Cookies from "js-cookie";

jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: jest.fn(),
}));
jest.mock("@/services/auth/api-access-redirect", () => ({
  resumeAfterApiAccess: jest.fn(),
}));
jest.mock("js-cookie", () => ({ get: jest.fn(), set: jest.fn() }));

describe("Access page", () => {
  const fetchMock = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock;
    jest.spyOn(window, "alert").mockImplementation(() => undefined);
    fetchMock.mockReset().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function submitCode() {
    const input = screen.getByRole("textbox", { name: "Team access code" });
    fireEvent.change(input, { target: { value: "team-code" } });
    fireEvent.keyDown(input, { key: "Enter" });
  }

  it("shows the local logo when the access API omits artwork", async () => {
    const readResponse = jest.fn(async () => ({ error: "Unauthorized" }));
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: readResponse,
    });

    render(<AccessPage />);

    await waitFor(() => expect(readResponse).toHaveBeenCalled());
    expect(screen.getByRole("img", { name: "6529" })).toHaveAttribute(
      "src",
      "/6529.svg"
    );
  });

  it("saves the code and resumes navigation without a dialog", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    render(<AccessPage />);
    submitCode();

    await waitFor(() => expect(resumeAfterApiAccess).toHaveBeenCalled());
    expect(Cookies.set).toHaveBeenCalledWith(
      API_AUTH_COOKIE,
      "team-code",
      expect.objectContaining({ sameSite: "strict" })
    );
    const [cookieWriteOrder = Infinity] = jest.mocked(Cookies.set).mock
      .invocationCallOrder;
    const [resumeOrder = 0] =
      jest.mocked(resumeAfterApiAccess).mock.invocationCallOrder;
    expect(cookieWriteOrder).toBeLessThan(resumeOrder);
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("resumes navigation immediately when access is already valid", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    render(<AccessPage />);
    await waitFor(() => expect(resumeAfterApiAccess).toHaveBeenCalled());
    expect(Cookies.set).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it.each([401, 403, 500])(
    "stays on the prompt after a %s response",
    async (status) => {
      render(<AccessPage />);
      fetchMock.mockResolvedValueOnce({ ok: false, status });
      submitCode();

      expect(await screen.findByRole("alert")).toBeVisible();
      expect(Cookies.set).not.toHaveBeenCalled();
      expect(window.alert).not.toHaveBeenCalled();
      expect(resumeAfterApiAccess).not.toHaveBeenCalled();
    }
  );
});
