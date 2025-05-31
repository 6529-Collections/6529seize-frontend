import { render, screen } from '@testing-library/react';
import PdfViewer from '../../../components/pdfViewer/PdfViewer';

jest.mock('../../../hooks/isMobileScreen', () => ({ __esModule: true, default: jest.fn() }));

const useIsMobileScreen = require('../../../hooks/isMobileScreen').default;

describe('PdfViewer', () => {
  it('renders a link on mobile', () => {
    useIsMobileScreen.mockReturnValue(true);
    render(<PdfViewer file="/test.pdf" name="Doc" />);
    const link = screen.getByRole('link', { name: 'Doc' });
    expect(link).toHaveAttribute('href', '/test.pdf');
  });

  it('renders an iframe on desktop', () => {
    useIsMobileScreen.mockReturnValue(false);
    render(<PdfViewer file="/test.pdf" name="Doc" />);
    const iframe = screen.getByTitle('Doc');
    expect(iframe).toHaveAttribute('src', '/test.pdf');
  });
});
