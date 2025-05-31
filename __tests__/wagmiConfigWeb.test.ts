import { wagmiConfigWeb } from '../wagmiConfig/wagmiConfigWeb';
import { mainnet } from 'viem/chains';

jest.mock('@web3modal/wagmi', () => ({ defaultWagmiConfig: jest.fn(() => ({})) }));

const mockDefault = require('@web3modal/wagmi').defaultWagmiConfig as jest.Mock;

describe('wagmiConfigWeb', () => {
  it('builds config with expected options', () => {
    const metadata = { name: 'test' };
    wagmiConfigWeb([mainnet], metadata);
    expect(mockDefault).toHaveBeenCalledWith({
      chains: [mainnet],
      projectId: '0ba285cc179045bec37f7c9b9e7f9fbf',
      metadata,
      enableCoinbase: true,
      coinbasePreference: 'all',
      auth: { email: false, socials: [] },
    });
  });
});
