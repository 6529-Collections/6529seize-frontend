import React from 'react';
import { render } from '@testing-library/react';
import ProfileActivityLogsItem from '../../../../components/profile-activity/list/ProfileActivityLogsItem';
import { ProfileActivityLogType } from '../../../../entities/IProfile';

jest.mock('../../../../components/profile-activity/list/items/ProfileActivityLogBanner', () => () => <div data-testid="BANNER" />);
jest.mock('../../../../components/profile-activity/list/items/ProfileActivityLogProxyActionState', () => () => <div data-testid="STATE" />);

const base = { type: ProfileActivityLogType.BANNER_1_EDIT } as any;

describe('ProfileActivityLogsItem additional cases', () => {
  it('renders banner component for banner edits', () => {
    const { rerender } = render(<ProfileActivityLogsItem log={base} user={null} />);
    expect(document.querySelector('[data-testid="BANNER"]')).toBeInTheDocument();
    rerender(<ProfileActivityLogsItem log={{ ...base, type: ProfileActivityLogType.BANNER_2_EDIT }} user={null} />);
    expect(document.querySelectorAll('[data-testid="BANNER"]').length).toBe(1);
  });

  it('renders proxy action state component', () => {
    render(<ProfileActivityLogsItem log={{ type: ProfileActivityLogType.PROXY_ACTION_STATE_CHANGED } as any} user={null} />);
    expect(document.querySelector('[data-testid="STATE"]')).toBeInTheDocument();
  });
});
