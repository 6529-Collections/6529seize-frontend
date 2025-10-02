import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentAddSpots from '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentAddSpots';
import { DistributionPlanToolContext } from '@/components/distribution-plan-tool/DistributionPlanToolContext';

// Mock nested components to keep the test focused on behavior
jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigNextBtn',
  () => ({ onNext, onSkip, showNextBtn, showSkipBtn, isDisabled, children }: any) => (
    <div>
      <button disabled={isDisabled} onClick={onNext} data-testid="next-btn">
        Next
      </button>
      {children}
      <span data-testid="show-next">{showNextBtn ? 'show' : 'hide'}</span>
      <span data-testid="show-skip">{showSkipBtn ? 'show' : 'hide'}</span>
    </div>
  )
);

jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle',
  () => () => <div data-testid="title" />
);

jest.mock(
  '@/components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta',
  () => ({ walletsCount }: any) => <div data-testid="meta">{walletsCount}</div>
);

jest.mock(
  '@/components/distribution-plan-tool/common/DistributionPlanSecondaryText',
  () => ({ children }: any) => <div>{children}</div>
);

function renderComponent(ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const defaultCtx = {
    setToasts: jest.fn(),
  } as any;
  return {
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <ComponentAddSpots
          onSelectMaxMintCount={jest.fn()}
          title="Title"
          uniqueWalletsCount={5}
          isLoadingUniqueWalletsCount={false}
          onClose={jest.fn()}
        />
      </DistributionPlanToolContext.Provider>
    ),
    setToasts: ctx?.setToasts || defaultCtx.setToasts,
  };
}

describe('ComponentAddSpots', () => {
  it('disables next button when no value provided', () => {
    renderComponent();
    expect(screen.getByTestId('next-btn')).toBeDisabled();
    expect(screen.getByTestId('show-next')).toHaveTextContent('hide');
  });

  it('disables next button when value is less than one', async () => {
    const setToasts = jest.fn();
    renderComponent({ setToasts });
    const input = screen.getByPlaceholderText('Max mint count per wallet');
    await userEvent.type(input, '0');
    const nextBtn = screen.getByTestId('next-btn');
    expect(nextBtn).toBeDisabled();
    expect(setToasts).not.toHaveBeenCalled();
  });

  it('calls onSelectMaxMintCount with valid value', async () => {
    const onSelectMaxMintCount = jest.fn();
    render(
      <DistributionPlanToolContext.Provider value={{ setToasts: jest.fn() } as any}>
        <ComponentAddSpots
          onSelectMaxMintCount={onSelectMaxMintCount}
          title="Title"
          uniqueWalletsCount={10}
          isLoadingUniqueWalletsCount={false}
          onClose={jest.fn()}
        />
      </DistributionPlanToolContext.Provider>
    );
    const input = screen.getByPlaceholderText('Max mint count per wallet');
    await userEvent.clear(input);
    await userEvent.type(input, '3');
    await userEvent.click(screen.getByTestId('next-btn'));
    expect(onSelectMaxMintCount).toHaveBeenCalledWith(3);
  });
});
