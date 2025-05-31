import { render } from '@testing-library/react';
import React from 'react';
import BannerIcon from '../../../../components/profile-activity/icons/ProfileActivityLogsBannerIcon';
import CertificateIcon from '../../../../components/profile-activity/icons/ProfileActivityLogsCertificateIcon';
import ProfileImageIcon from '../../../../components/profile-activity/icons/ProfileActivityLogsProfileImageIcon';
import SocialPostIcon from '../../../../components/profile-activity/icons/ProfileActivityLogsSocialMediaVerificationPostIcon';

describe('profile activity icons', () => {
  it('render svg elements', () => {
    const { container: c1 } = render(<BannerIcon />);
    expect(c1.querySelector('svg')).toBeInTheDocument();
    const { container: c2 } = render(<CertificateIcon />);
    expect(c2.querySelector('svg')).toBeInTheDocument();
    const { container: c3 } = render(<ProfileImageIcon />);
    expect(c3.querySelector('svg')).toBeInTheDocument();
    const { container: c4 } = render(<SocialPostIcon />);
    expect(c4.querySelector('svg')).toBeInTheDocument();
  });
});
