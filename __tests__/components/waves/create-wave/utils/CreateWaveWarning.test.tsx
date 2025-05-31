import { render, screen } from '@testing-library/react';
import CreateWaveWarning from '../../../../../components/waves/create-wave/utils/CreateWaveWarning';

describe('CreateWaveWarning', () => {
  it('renders provided title and description', () => {
    render(<CreateWaveWarning title="Heads up" description="Be careful" />);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Be careful')).toBeInTheDocument();
  });
});
