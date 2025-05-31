import { render } from '@testing-library/react';
import React from 'react';
import ProfileActivityLogsIcon from '../../../../components/profile-activity/icons/ProfileActivityLogsIcon';
import { ProfileActivityLogType } from '../../../../entities/IProfile';

jest.mock('../../../../components/profile-activity/icons/ProfileActivityLogsProxyActionCreatedIcon', () => () => <div data-testid="proxy-created" />);
jest.mock('../../../../components/profile-activity/icons/ProfileActivityLogsProfileArchivedIcon', () => () => <div data-testid="archived" />);

describe('ProfileActivityLogsIcon extra', () => {
  it('renders proxy created and archived icons', () => {
    const { getByTestId, rerender } = render(<ProfileActivityLogsIcon logType={ProfileActivityLogType.PROXY_ACTION_CREATED} />);
    expect(getByTestId('proxy-created')).toBeInTheDocument();
    rerender(<ProfileActivityLogsIcon logType={ProfileActivityLogType.PROFILE_ARCHIVED} />);
    expect(getByTestId('archived')).toBeInTheDocument();
  });
});
