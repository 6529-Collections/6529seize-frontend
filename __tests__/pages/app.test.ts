// @ts-nocheck
import { Chain, mainnet, sepolia, goerli } from 'wagmi/chains';

describe('getChains', () => {
  const loadGetChains = (mocks: {delegation?: Chain; nextgen?: Chain; subs?: Chain; manifold?: Chain}) => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('@web3modal/wagmi/react', () => ({ createWeb3Modal: jest.fn() }));
      jest.doMock('../../wagmiConfig/wagmiConfigWeb', () => ({ wagmiConfigWeb: jest.fn(() => ({})) }));
      jest.doMock('../../wagmiConfig/wagmiConfigCapacitor', () => ({ wagmiConfigCapacitor: jest.fn(() => ({})) }));
      jest.doMock('../../store/store', () => ({ wrapper: { useWrappedStore: jest.fn(() => ({store:{}, props:{}})) } }));
      jest.doMock('../../components/nextGen/nextgen_contracts', () => ({ NEXTGEN_CHAIN_ID: mocks.nextgen?.id ?? mainnet.id }));
      jest.doMock('../../hooks/useManifoldClaim', () => ({ MANIFOLD_NETWORK: mocks.manifold ?? mainnet }));
      jest.doMock('../../constants', () => ({
        CW_PROJECT_ID: '1',
        DELEGATION_CONTRACT: { chain_id: mocks.delegation?.id ?? mainnet.id, contract: '0x0' },
        SUBSCRIPTIONS_CHAIN: mocks.subs ?? mainnet,
      }));
      const mod = require('../../pages/_app');
      chains = mod.getChains();
    });
    return chains;
  };
  let chains: Chain[] = [];

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns mainnet when no test nets configured', () => {
    const result = loadGetChains({});
    expect(result.map(c => c.id)).toEqual([mainnet.id]);
  });

  it('includes sepolia when delegation contract uses sepolia', () => {
    const result = loadGetChains({delegation: sepolia});
    expect(result.map(c => c.id)).toEqual([mainnet.id, sepolia.id]);
  });

  it('includes goerli when NEXTGEN_CHAIN_ID is goerli', () => {
    const result = loadGetChains({nextgen: goerli});
    expect(result.map(c => c.id)).toEqual([mainnet.id, goerli.id]);
  });

  it('combines multiple test chains without duplicates', () => {
    const result = loadGetChains({delegation: sepolia, nextgen: goerli, subs: sepolia});
    expect(result.map(c => c.id)).toEqual([mainnet.id, sepolia.id, goerli.id]);
  });
});
