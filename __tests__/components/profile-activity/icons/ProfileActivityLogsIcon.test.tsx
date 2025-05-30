import { render } from '@testing-library/react';
import React from 'react';
import ProfileActivityLogsIcon from '../../../../components/profile-activity/icons/ProfileActivityLogsIcon';
import { ProfileActivityLogType } from '../../../../entities/IProfile';

jest.mock('../../../../components/profile-activity/icons/ProfileActivityLogsCICRatingIcon', () => () => <div data-testid="cic" />);
jest.mock('../../../../components/profile-activity/icons/ProfileActivityLogsHandleIcon', () => () => <div data-testid="handle" />);
jest.mock('../../../../components/profile-activity/icons/ProfileActivityLogsContactIcon', () => () => <div data-testid="contact" />);

describe('ProfileActivityLogsIcon', () => {
  it('renders icon for given type', () => {
    const { getByTestId, rerender } = render(<ProfileActivityLogsIcon logType={ProfileActivityLogType.RATING_EDIT} />);
    expect(getByTestId('cic')).toBeInTheDocument();

    rerender(<ProfileActivityLogsIcon logType={ProfileActivityLogType.HANDLE_EDIT} />);
    expect(getByTestId('handle')).toBeInTheDocument();
  });

  it('throws for unknown type', () => {
    expect(() => render(<ProfileActivityLogsIcon logType={'BAD' as any} />)).toThrow();
  });
});
