import { render, screen } from '@testing-library/react';
import GroupCardActionWrapper from '@/components/groups/page/list/card/GroupCardActionWrapper';
import { ApiRateMatter } from '@/generated/models/ApiRateMatter';

jest.mock('@/components/groups/page/list/card/utils/GroupCardActionFooter', () => (props: any) => (
  <div data-testid="footer" data-loading={props.loading} data-disabled={props.disabled} />
));

describe('GroupCardActionWrapper', () => {
  it('shows children when not adding rates', () => {
    render(
      <GroupCardActionWrapper
        loading={false}
        disabled={false}
        addingRates={false}
        doneMembersCount={null}
        membersCount={null}
        matter={ApiRateMatter.Rep}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      >
        <span data-testid="child" />
      </GroupCardActionWrapper>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('shows progress when adding rates', () => {
    const { rerender } = render(
      <GroupCardActionWrapper
        loading={false}
        disabled={false}
        addingRates={true}
        doneMembersCount={5}
        membersCount={10}
        matter={ApiRateMatter.Rep}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      >
        <span />
      </GroupCardActionWrapper>
    );
    expect(screen.getByText('Rep Progress')).toBeInTheDocument();
    expect(screen.getByText('5/10')).toBeInTheDocument();
    
    const progressBarContainer = document.querySelector('.tw-bg-iron-700') as HTMLElement;
    expect(progressBarContainer).toBeInTheDocument();
    
    const progressBar = progressBarContainer?.querySelector('.tw-bg-primary-400') as HTMLElement;
    expect(progressBar).toBeInTheDocument();
    expect(progressBar.style.width).toBe('50%');

    rerender(
      <GroupCardActionWrapper
        loading={false}
        disabled={false}
        addingRates={true}
        doneMembersCount={10}
        membersCount={10}
        matter={ApiRateMatter.Rep}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      >
        <span />
      </GroupCardActionWrapper>
    );
    expect(screen.getByText('10/10')).toBeInTheDocument();
    
    const updatedProgressBar = progressBarContainer?.querySelector('.tw-bg-primary-400') as HTMLElement;
    expect(updatedProgressBar.style.width).toBe('100%');
  });
});
