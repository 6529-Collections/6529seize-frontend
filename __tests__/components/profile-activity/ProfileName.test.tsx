import { render, screen } from '@testing-library/react';
import ProfileName, { ProfileNameType } from '../../../components/profile-activity/ProfileName';
import { useRouter } from 'next/router';
import { useIdentity } from '../../../hooks/useIdentity';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../hooks/useIdentity');

const useIdentityMock = useIdentity as jest.MockedFunction<typeof useIdentity>;

describe('ProfileName', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ query: { user: 'bob' } });
  });

  it('shows possession string', () => {
    useIdentityMock.mockReturnValue({ profile: { handle: 'bob' } as any });
    render(<ProfileName type={ProfileNameType.POSSESSION} />);
    expect(screen.getByText("bob's")).toBeInTheDocument();
  });

  it('updates when profile changes', () => {
    let profile: any = null;
    useIdentityMock.mockImplementation(() => ({ profile }));
    const { container, rerender } = render(<ProfileName type={ProfileNameType.DEFAULT} />);
    expect(container.textContent).toBe('');
    profile = { handle: 'alice' };
    rerender(<ProfileName type={ProfileNameType.DEFAULT} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });
});
