import { render } from '@testing-library/react';
import HeaderPlaceholder from '@/components/header/HeaderPlaceholder';
import useCapacitor from '@/hooks/useCapacitor';
import styles from '@/components/header/Header.module.scss';

jest.mock('@/hooks/useCapacitor');

const mockUseCapacitor = useCapacitor as jest.MockedFunction<typeof useCapacitor>;

describe('HeaderPlaceholder', () => {
  it('uses regular placeholder class when not running in Capacitor', () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: false } as any);
    const { container } = render(<HeaderPlaceholder />);
    expect(container.firstChild).toHaveClass(styles["headerPlaceholder"]);
  });

  it('uses capacitor placeholder class when running in Capacitor', () => {
    mockUseCapacitor.mockReturnValue({ isCapacitor: true } as any);
    const { container } = render(<HeaderPlaceholder />);
    expect(container.firstChild).toHaveClass(styles["headerPlaceholderCapacitor"]);
  });
});
