import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import AccessPage from "@/app/access/page.client";
import { API_AUTH_COOKIE } from "@/constants/constants";
import {
  redirectToRestrictedAccess,
  resumeAfterApiAccess,
} from "@/services/auth/api-access-redirect";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Cookies from "js-cookie";

jest.mock("@/contexts/TitleContext", () => ({ useSetTitle: jest.fn() }));
jest.mock("@/hooks/useNativeKeyboard", () => ({
  useNativeKeyboard: jest.fn(),
}));
jest.mock("@/services/auth/api-access-redirect", () => ({
  redirectToRestrictedAccess: jest.fn(),
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

  function submitCode(code = "team-code") {
    const input = screen.getByLabelText("Team Login");
    fireEvent.change(input, { target: { value: code } });
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
      "/gradient-100.svg"
    );
  });

  it("uses artwork supplied by the access API instead of the local logo", async () => {
    const artwork = "https://api.example.test/access-artwork.webp";
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ image: artwork }),
    });

    render(<AccessPage />);

    expect(await screen.findByAltText("")).toHaveAttribute("src", artwork);
    expect(screen.queryByRole("img", { name: "6529" })).not.toBeInTheDocument();
  });

  it("saves the code and stays locked while navigation is pending", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    render(<AccessPage />);
    const input = screen.getByLabelText("Team Login");
    expect(input).toHaveAttribute("placeholder", "Enter password");
    expect(input).toHaveAttribute("type", "text");
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
    expect(input).toHaveAttribute("readonly");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Opening page…");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(status).toHaveTextContent("Opening page…");
    expect(window.alert).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("resumes navigation immediately when access is already valid", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    render(<AccessPage />);
    await waitFor(() => expect(resumeAfterApiAccess).toHaveBeenCalled());
    expect(screen.getByLabelText("Team Login")).toHaveAttribute("readonly");
    expect(screen.getByRole("status")).toHaveTextContent("Opening page…");
    expect(Cookies.set).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("accepts only one verification at a time and allows another try after rejection", async () => {
    const request = createDeferredPromise<Pick<Response, "ok" | "status">>();
    render(<AccessPage />);
    fetchMock.mockReturnValueOnce(request.promise);
    const input = screen.getByLabelText("Team Login");
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    submitCode();
    fireEvent.keyDown(input, { key: "Enter" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Verifying code…");

    request.resolve({ ok: false, status: 401 });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Access Denied!"
    );
    expect(input).not.toHaveAttribute("readonly");
    expect(status).toBeEmptyDOMElement();

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    submitCode("corrected-code");

    await waitFor(() => expect(resumeAfterApiAccess).toHaveBeenCalledTimes(1));
    expect(Cookies.set).toHaveBeenCalledWith(
      API_AUTH_COOKIE,
      "corrected-code",
      expect.any(Object)
    );
  });

  it.each(["initial probe", "code submission"] as const)(
    "opens the restricted page on 403 during the %s",
    async (phase) => {
      if (phase === "initial probe") {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
      }
      render(<AccessPage />);
      if (phase === "code submission") {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 403 });
        submitCode();
      }

      await waitFor(() =>
        expect(redirectToRestrictedAccess).toHaveBeenCalled()
      );
      expect(screen.getByLabelText("Team Login")).toHaveAttribute("readonly");
      expect(Cookies.set).not.toHaveBeenCalled();
      expect(resumeAfterApiAccess).not.toHaveBeenCalled();
    }
  );

  it("unlocks the field and allows a retry when verification stalls", async () => {
    jest.useFakeTimers();
    try {
      const request = createDeferredPromise<Pick<Response, "ok" | "status">>();
      render(<AccessPage />);
      let signal: AbortSignal | null | undefined;
      fetchMock.mockImplementationOnce((_url: string, init: RequestInit) => {
        signal = init.signal;
        return request.promise;
      });
      submitCode();

      const input = screen.getByLabelText("Team Login");
      expect(input).toHaveAttribute("readonly");
      await act(async () => jest.advanceTimersByTimeAsync(10_000));

      expect(signal?.aborted).toBe(true);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Could not verify access"
      );
      expect(input).not.toHaveAttribute("readonly");
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
      submitCode("corrected-code");
      await waitFor(() =>
        expect(resumeAfterApiAccess).toHaveBeenCalledTimes(1)
      );
      await act(async () => {
        request.resolve({ ok: true, status: 200 });
      });
      expect(resumeAfterApiAccess).toHaveBeenCalledTimes(1);
      expect(Cookies.set).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it.each([401, 500])(
    "stays on the prompt after a %s response",
    async (status) => {
      render(<AccessPage />);
      fetchMock.mockResolvedValueOnce({ ok: false, status });
      submitCode();

      expect(await screen.findByRole("alert")).toBeVisible();
      expect(screen.getByLabelText("Team Login")).not.toHaveAttribute(
        "readonly"
      );
      expect(Cookies.set).not.toHaveBeenCalled();
      expect(window.alert).not.toHaveBeenCalled();
      expect(resumeAfterApiAccess).not.toHaveBeenCalled();
    }
  );
});
