import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComponentSelectRandomHolders from '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentSelectRandomHolders';
import { DistributionPlanToolContext } from '../../../../../components/distribution-plan-tool/DistributionPlanToolContext';
import { RandomHoldersType } from '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal';
import { ComponentRandomHoldersWeightType } from '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeight';

// Mock nested components to isolate behaviour
jest.mock(
  '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigNextBtn',
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
  '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalTitle',
  () => () => <div data-testid="title" />
);

jest.mock(
  '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/ComponentConfigMeta',
  () => ({ walletsCount }: any) => <div data-testid="meta">{String(walletsCount)}</div>
);

jest.mock(
  '../../../../../components/distribution-plan-tool/common/DistributionPlanSecondaryText',
  () => ({ children }: any) => <div>{children}</div>
);

jest.mock(
  '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/BuildPhaseFormConfigModalSidebar',
  () => ({ options, selectedOption, setSelectedOption }: any) => (
    <div>
      {options.map((o: any) => (
        <button key={o.value} onClick={() => setSelectedOption(o.value)} data-testid={`option-${o.value}`}>
          {o.label}
        </button>
      ))}
      <span data-testid="selected">{selectedOption}</span>
    </div>
  )
);

jest.mock(
  '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeight',
  () => {
    const actual = jest.requireActual(
      '../../../../../components/distribution-plan-tool/build-phases/build-phase/form/component-config/utils/ComponentRandomHoldersWeight'
    );
    return {
      __esModule: true,
      ...actual,
      default: ({ onChange, selected }: any) => (
        <div>
          <button onClick={() => onChange('UNIQUE_CARDS')} data-testid="weight-btn">
            weight
          </button>
          <span data-testid="weight-selected">{selected}</span>
        </div>
      ),
    };
  }
);

function renderComponent(ctx?: Partial<React.ContextType<typeof DistributionPlanToolContext>>) {
  const defaultCtx = {
    setToasts: jest.fn(),
    distributionPlan: { id: 'plan1' },
  } as any;
  const onSelectRandomHolders = jest.fn();
  return {
    ...render(
      <DistributionPlanToolContext.Provider value={{ ...defaultCtx, ...ctx }}>
        <ComponentSelectRandomHolders
          onSelectRandomHolders={onSelectRandomHolders}
          onNextStep={jest.fn()}
          title="Title"
          uniqueWalletsCount={100}
          isLoadingUniqueWalletsCount={false}
          onClose={jest.fn()}
        />
      </DistributionPlanToolContext.Provider>
    ),
    onSelectRandomHolders,
    setToasts: ctx?.setToasts || defaultCtx.setToasts,
  };
}

describe('ComponentSelectRandomHolders', () => {
  it('disables next button when no value provided', () => {
    renderComponent();
    expect(screen.getByTestId('next-btn')).toBeDisabled();
    expect(screen.getByTestId('show-next')).toHaveTextContent('hide');
  });

  it('disables next button when value is less than one', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Example: 100');
    await userEvent.type(input, '0');
    expect(screen.getByTestId('next-btn')).toBeDisabled();
  });

  it('calls onSelectRandomHolders with percentage value', async () => {
    const { onSelectRandomHolders, setToasts } = renderComponent();
    // switch to percentage option
    await userEvent.click(screen.getByTestId(`option-${RandomHoldersType.BY_PERCENTAGE}`));
    const input = screen.getByPlaceholderText('Example: 10');
    await userEvent.type(input, '50');
    await userEvent.click(screen.getByTestId('next-btn'));
    expect(onSelectRandomHolders).toHaveBeenCalledWith({
      value: 50,
      randomHoldersType: RandomHoldersType.BY_PERCENTAGE,
      weightType: ComponentRandomHoldersWeightType.OFF,
      seed: 'plan1',
    });
    expect(setToasts).not.toHaveBeenCalled();
    expect(screen.getByTestId('meta')).toHaveTextContent('50');
  });
});
