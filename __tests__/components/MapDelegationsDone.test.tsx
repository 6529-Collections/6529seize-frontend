import { render, screen } from '@testing-library/react';
import MapDelegationsDone from '@/components/distribution-plan-tool/map-delegations/MapDelegationsDone';

describe('MapDelegationsDone', () => {
  it('renders the contract address', () => {
    render(<MapDelegationsDone contract="0x123" />);
    expect(screen.getByText(/contract/)).toHaveTextContent('0x123');
  });
});
