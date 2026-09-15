import { useEffect } from "react";
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createConfig, http, useConfig, type Config } from "wagmi";
import { mainnet } from "viem/chains";
import { hydrate } from "@wagmi/core";
import DeferredWagmiProvider from "@/components/providers/DeferredWagmiProvider";

jest.mock("@wagmi/core", () => ({
  ...jest.requireActual("@wagmi/core"),
  hydrate: jest.fn(),
}));

it("mounts each config after commit without remounting public content", () => {
  const first = createConfig({
    chains: [mainnet],
    transports: { 1: http() },
    ssr: true,
  });
  const second = createConfig({
    chains: [mainnet],
    transports: { 1: http() },
    ssr: false,
  });
  const onMount = jest.fn().mockResolvedValue(undefined);
  const onContentMount = jest.fn();
  const renderedConfigs: Config[] = [];
  jest.mocked(hydrate).mockReturnValue({ onMount });
  function Content() {
    renderedConfigs.push(useConfig());
    // Reconnect has not run on a config before its first child render.
    if (renderedConfigs.length === 1) expect(onMount).not.toHaveBeenCalled();
    useEffect(onContentMount, []);
    return <p>Public content</p>;
  }
  const tree = (config: Config, reconnectOnMount: boolean) => (
    <DeferredWagmiProvider config={config} reconnectOnMount={reconnectOnMount}>
      <Content />
    </DeferredWagmiProvider>
  );
  expect(renderToString(tree(first, false))).toContain("Public content");
  expect(hydrate).not.toHaveBeenCalled();
  const view = render(tree(first, false));
  view.rerender(tree(second, true));
  view.rerender(tree(second, true));
  expect(hydrate).toHaveBeenNthCalledWith(1, first, {
    reconnectOnMount: false,
  });
  expect(hydrate).toHaveBeenNthCalledWith(2, second, {
    reconnectOnMount: true,
  });
  expect(onMount).toHaveBeenCalledTimes(2);
  expect(onContentMount).toHaveBeenCalledTimes(1);
  expect(renderedConfigs.at(-1)).toBe(second);
});
