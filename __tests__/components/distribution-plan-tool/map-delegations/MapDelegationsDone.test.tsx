import React from 'react';
import { render, screen } from '@testing-library/react';
import MapDelegationsDone from '../../../../components/distribution-plan-tool/map-delegations/MapDelegationsDone';

describe('MapDelegationsDone', () => {
  it('displays contract with bold highlight', () => {
    render(<MapDelegationsDone contract="0xABC" />);
    expect(screen.getByText(/Delegations are done using contract/i)).toBeInTheDocument();
    const bold = screen.getByText('0xABC');
    expect(bold).toBeInTheDocument();
    expect(bold).toHaveClass('tw-font-bold');
  });
});
