import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  E2eeEmojiProvider,
  useE2eeEmojis,
} from "@/components/e2ee/conversation/E2eeEmojiProvider";
import { E2eeEmojiText } from "@/components/e2ee/conversation/E2eeEmojiText";

function Retry() {
  const { failed, retry } = useE2eeEmojis();
  return failed ? <button onClick={retry}>Retry pack</button> : null;
}

it("recovers from HTTP failure and an empty successful response, using only inline images", async () => {
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: "gm", src: "data:image/webp;base64,UklGRg==" }],
    });
  globalThis.fetch = fetchMock;
  render(
    <E2eeEmojiProvider>
      <Retry />
      <p>
        <E2eeEmojiText text="Hi :gm: :unknown: 😀" />
      </p>
    </E2eeEmojiProvider>
  );
  const retry = await screen.findByRole("button", { name: "Retry pack" });
  await act(async () => {
    fireEvent.click(retry);
  });
  expect(screen.queryByRole("img", { name: ":gm:" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry pack" }));
  const image = await screen.findByRole("img", { name: ":gm:" });
  expect(image).toHaveAttribute("src", "data:image/webp;base64,UklGRg==");
  expect(image.parentElement).toHaveTextContent("Hi :unknown: 😀");
  expect(fetchMock).toHaveBeenCalledTimes(3);
  for (const call of fetchMock.mock.calls)
    expect(call).toEqual([
      "/api/e2ee/emoji-pack",
      { credentials: "omit", referrerPolicy: "no-referrer" },
    ]);
});
