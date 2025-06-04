import { render, screen } from '@testing-library/react';
import Footer from '../../../components/footer/Footer';
import { AboutSection } from '../../../pages/about/[section]';

describe('Footer', () => {
  it('renders social links with images', () => {
    render(<Footer />);
    const punk = screen.getByRole('link', { name: /@punk6529/i });
    expect(punk).toHaveAttribute('href', 'https://x.com/punk6529');
    const collections = screen.getByRole('link', { name: /@6529Collections/i });
    expect(collections).toHaveAttribute('href', 'https://x.com/6529Collections');
    const discord = screen.getByRole('link', { name: /OM Discord/i });
    expect(discord).toHaveAttribute('href', 'https://discord.gg/join-om');
    const github = screen.getByRole('link', { name: /6529-Collections/i });
    expect(github).toHaveAttribute('href', 'https://github.com/6529-Collections');
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(4);
  });

  it('renders policy and contact links', () => {
    render(<Footer />);
    expect(
      screen.getByRole('link', { name: 'Terms of Service' })
    ).toHaveAttribute('href', `/about/${AboutSection.TERMS_OF_SERVICE}`);
    expect(
      screen.getByRole('link', { name: 'Privacy Policy' })
    ).toHaveAttribute('href', `/about/${AboutSection.PRIVACY_POLICY}`);
    expect(
      screen.getByRole('link', { name: 'Copyright' })
    ).toHaveAttribute('href', `/about/${AboutSection.COPYRIGHT}`);
    expect(
      screen.getByRole('link', { name: 'Cookie Policy' })
    ).toHaveAttribute('href', `/about/${AboutSection.COOKIE_POLICY}`);
    expect(
      screen.getByRole('link', { name: 'License' })
    ).toHaveAttribute('href', `/about/${AboutSection.LICENSE}`);
    expect(
      screen.getByRole('link', { name: 'API Documentation' })
    ).toHaveAttribute('href', 'https://api.6529.io/docs');
    expect(
      screen.getByRole('link', { name: 'Contact Us' })
    ).toHaveAttribute('href', `/about/${AboutSection.CONTACT_US}`);
    expect(screen.getByRole('link', { name: 'Status' })).toHaveAttribute(
      'href',
      'https://status.6529.io/'
    );
  });
});
