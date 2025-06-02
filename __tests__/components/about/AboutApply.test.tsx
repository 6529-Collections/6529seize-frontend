import { render, screen } from '@testing-library/react';
import AboutApply from '../../../components/about/AboutApply';

describe('AboutApply', () => {
  it('displays eligibility requirements', () => {
    render(<AboutApply />);
    expect(
      screen.getByText(/Previous Meme Artist/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Community Nomination/i)
    ).toBeInTheDocument();
  });

  it('links to the Seeking Nomination wave', () => {
    render(<AboutApply />);
    const link = screen.getByRole('link', {
      name: /The Memes - Seeking Nomination/i,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://6529.io/my-stream?wave=0ecb95d0-d8f2-48e8-8137-bfa71ee8593c'
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows checkpoint schedule days', () => {
    render(<AboutApply />);
    ['Monday', 'Wednesday', 'Friday'].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('includes artist feedback usernames', () => {
    render(<AboutApply />);
    ['@6529er', '@teexels', '@darrensrs'].forEach((handle) => {
      expect(screen.getByText(handle)).toBeInTheDocument();
    });
  });

  it('contains contact email link', () => {
    render(<AboutApply />);
    const link = screen.getByRole('link', { name: /collections@6529.io/i });
    expect(link).toHaveAttribute('href', 'mailto:collections@6529.io');
  });
});
