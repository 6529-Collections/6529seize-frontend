import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DropListItemContentMention from '../../../../../../components/drops/view/item/content/DropListItemContentMention';

jest.mock('../../../../../../components/utils/tooltip/UserProfileTooltipWrapper', () => ({ user, children }: any) => <div data-testid="tooltip-wrapper" data-user={user}>{children}</div>);
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));

describe('DropListItemContentMention', () => {
  it('renders link and stops propagation', () => {
    const user: any = { mentioned_profile_id: '1', handle_in_content: 'bob' };
    const { container } = render(<DropListItemContentMention user={user} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/bob');
    expect(link).toHaveTextContent('@bob');
    fireEvent.click(link);
    expect(container.querySelector('[data-testid="tooltip-wrapper"]')).toBeInTheDocument();
  });
});
