import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import DropListItemRateGive, { RateChangeType } from '../../../../../../../components/drops/view/item/rate/give/DropListItemRateGive';
import { AuthContext } from '../../../../../../../components/auth/Auth';
import { ProfileConnectedStatus } from '../../../../../../../entities/IProfile';

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));

const submitMock = jest.fn((props: any) => <div data-testid="submit" data-rate={props.rate} />);
jest.mock('../../../../../../../components/drops/view/item/rate/give/DropListItemRateGiveSubmit', () => (props: any) => submitMock(props));

const dropInteractionMock = { canVote: true };
jest.mock('../../../../../../../hooks/drops/useDropInteractionRules', () => ({ useDropInteractionRules: () => dropInteractionMock }));

const drop = {
  id: 'd1',
  context_profile_context: { max_rating: 5, min_rating: -5 },
} as any;

const renderComponent = () =>
  render(
    <AuthContext.Provider value={{ connectionStatus: ProfileConnectedStatus.HAVE_PROFILE } as any}>
      <DropListItemRateGive drop={drop} />
    </AuthContext.Provider>
  );

describe('DropListItemRateGive', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    submitMock.mockClear();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('increases rate while mouse is held down', () => {
    renderComponent();
    const incBtn = screen.getByLabelText('Choose positive votes');
    act(() => {
      fireEvent.mouseDown(incBtn);
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByTestId('submit').getAttribute('data-rate')).toBe('3');
    act(() => {
      fireEvent.mouseUp(incBtn);
      jest.advanceTimersByTime(1000);
    });
    // no further changes after mouse up
    expect(screen.getByTestId('submit').getAttribute('data-rate')).toBe('3');
  });

  it('does not allow rating when voting disabled', () => {
    dropInteractionMock.canVote = false;
    renderComponent();
    expect(screen.getByTestId('submit').getAttribute('data-rate')).toBe('0');
  });
});
