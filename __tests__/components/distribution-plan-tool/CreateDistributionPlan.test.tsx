import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateDistributionPlan from '../../../components/distribution-plan-tool/create-plan/CreateDistributionPlan';
import { distributionPlanApiPost } from '../../../services/distribution-plan-api';

jest.mock('../../../services/distribution-plan-api');

const mockedPost = distributionPlanApiPost as jest.Mock;

describe('CreateDistributionPlan', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('submits form and calls onSuccess on success', async () => {
    mockedPost.mockResolvedValue({ success: true, data: { id: '123' } });
    const onSuccess = jest.fn();
    render(<CreateDistributionPlan onSuccess={onSuccess} />);
    await userEvent.type(screen.getByPlaceholderText('Make a name for your distribution'), 'name');
    await userEvent.type(screen.getByPlaceholderText('Description of your drop'), 'desc');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(mockedPost).toHaveBeenCalled();
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('123'));
  });

  it('does not submit when fields are empty', async () => {
    const onSuccess = jest.fn();
    render(<CreateDistributionPlan onSuccess={onSuccess} />);
    await userEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(mockedPost).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
