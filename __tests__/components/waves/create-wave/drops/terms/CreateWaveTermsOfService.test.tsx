import { render, screen, fireEvent } from '@testing-library/react';
import CreateWaveTermsOfService from '../../../../../../components/waves/create-wave/drops/terms/CreateWaveTermsOfService';
import { ApiWaveType } from '../../../../../../generated/models/ApiWaveType';

describe('CreateWaveTermsOfService', () => {
  it('renders toggle and textarea when enabled', () => {
    const setTerms = jest.fn();
    render(
      <CreateWaveTermsOfService
        waveType={ApiWaveType.Rank}
        terms="abc"
        setTerms={setTerms}
      />
    );
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } });
    expect(setTerms).toHaveBeenCalledWith('xyz');
  });

  it('does not render for Chat waves', () => {
    const { container } = render(
      <CreateWaveTermsOfService waveType={ApiWaveType.Chat} terms={null} setTerms={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
