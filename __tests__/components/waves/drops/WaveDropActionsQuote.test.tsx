import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import WaveDropActionsQuote from '@/components/waves/drops/WaveDropActionsQuote';
import { AuthContext } from '@/components/auth/Auth';
import { WaveEligibilityProvider } from '@/contexts/wave/WaveEligibilityContext';

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>
}));

describe('WaveDropActionsQuote', () => {
  const baseDrop: any = { id: '1', wave: { authenticated_user_eligible_to_chat: true } };
  const mockSetToast = jest.fn();
  
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <WaveEligibilityProvider>
        <AuthContext.Provider value={{ setToast: mockSetToast } as any}>
          {component}
        </AuthContext.Provider>
      </WaveEligibilityProvider>
    );
  };

  it('calls handler when allowed', () => {
    const onQuote = jest.fn();
    const { getByRole } = renderWithAuth(<WaveDropActionsQuote drop={baseDrop} onQuote={onQuote} activePartIndex={0} />);
    fireEvent.click(getByRole('button'));
    expect(onQuote).toHaveBeenCalled();
  });

  it('disables button for temporary drop', () => {
    const drop = { ...baseDrop, id: 'temp-1' };
    const { getByRole } = renderWithAuth(<WaveDropActionsQuote drop={drop} onQuote={jest.fn()} activePartIndex={0} />);
    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('tw-opacity-50');
  });
});
