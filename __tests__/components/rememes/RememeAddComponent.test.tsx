import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RememeAddComponent, { ProcessedRememe } from '../../../components/rememes/RememeAddComponent';
import { NFT } from '../../../entities/INFT';
import * as api from '../../../services/6529api';

// Mock the services
jest.mock('../../../services/6529api');
const mockPostData = api.postData as jest.MockedFunction<typeof api.postData>;

// Mock wagmi
jest.mock('wagmi', () => ({
  useEnsName: jest.fn(() => ({
    isSuccess: false,
    data: null,
  })),
}));

// Mock helpers
jest.mock('../../../helpers/Helpers', () => ({
  areEqualAddresses: jest.fn((a, b) => a?.toLowerCase() === b?.toLowerCase()),
  formatAddress: jest.fn((address) => `${address?.slice(0, 6)}...${address?.slice(-4)}`),
  isValidEthAddress: jest.fn((address) => /^0x[a-fA-F0-9]{40}$/.test(address)),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height }: any) => (
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

describe('RememeAddComponent', () => {
  const mockMemes: NFT[] = [
    {
      id: 1,
      name: 'The Memes #1',
      description: 'Test meme 1',
      image: 'test1.jpg',
      animation_url: '',
      animation_url_new: '',
      contract: '0x123',
      token_id: 1,
      mint_date: '',
      minted_by: '',
      tdh: 0,
    },
    {
      id: 2,
      name: 'The Memes #2', 
      description: 'Test meme 2',
      image: 'test2.jpg',
      animation_url: '',
      animation_url_new: '',
      contract: '0x456',
      token_id: 2,
      mint_date: '',
      minted_by: '',
      tdh: 0,
    },
  ];

  const mockVerifiedRememe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <RememeAddComponent
        memes={mockMemes}
        verifiedRememe={mockVerifiedRememe}
      />
    );
  };

  it('renders with initial form fields', () => {
    renderComponent();
    
    expect(screen.getByText('Contract')).toBeTruthy();
    expect(screen.getByText('Token IDs')).toBeTruthy();
    expect(screen.getByPlaceholderText('0x...')).toBeTruthy();
    expect(screen.getByPlaceholderText(/1,2,3 or 1-3/)).toBeTruthy();
    expect(screen.getByText(/meme references/i)).toBeTruthy();
  });

  it('renders references dropdown with available memes', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    
    expect(screen.getByText('#1 - The Memes #1')).toBeTruthy();
    expect(screen.getByText('#2 - The Memes #2')).toBeTruthy();
  });

  it('adds and removes meme references', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Add a reference
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    expect(screen.getByText('Meme References (1)')).toBeTruthy();
    expect(screen.getByText('#1 - The Memes #1')).toBeTruthy();
    
    // Remove the reference
    const removeButton = screen.getByText('x');
    await user.click(removeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Meme References')).toBeTruthy();
      // The reference should still exist in the dropdown, but not in the references list
      // Check that the text "Meme References (1)" is no longer present
      expect(screen.queryByText('Meme References (1)')).toBeNull();
    });
  });

  it('disables validate button when required fields are empty', () => {
    renderComponent();
    
    const validateButton = screen.getByRole('button', { name: /validate/i });
    expect(validateButton).toBeDisabled();
  });

  it('enables validate button when all required fields are filled', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Fill contract address
    const contractInput = screen.getByPlaceholderText('0x...');
    await user.type(contractInput, '0x1234567890123456789012345678901234567890');
    
    // Fill token IDs
    const tokenIdInput = screen.getByPlaceholderText(/1,2,3 or 1-3/);
    await user.type(tokenIdInput, '1,2,3');
    
    // Add a reference
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    const validateButton = screen.getByRole('button', { name: /validate/i });
    expect(validateButton).toBeEnabled();
  });

  it('parses single token ID correctly', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 200,
      response: {
        valid: true,
        contract: { name: 'Test Contract' },
        nfts: [{ tokenId: '1', name: 'Test NFT', raw: {} }],
      },
    });
    
    // Fill form
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), '1');
    
    // Add reference
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    // Validate
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(mockPostData).toHaveBeenCalledWith(
        expect.stringContaining('/api/rememes/validate'),
        expect.objectContaining({
          contract: '0x1234567890123456789012345678901234567890',
          token_ids: ['1'],
          references: [1],
        })
      );
    });
  });

  it('parses comma-separated token IDs correctly', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 200,
      response: {
        valid: true,
        contract: { name: 'Test Contract' },
        nfts: [
          { tokenId: '1', name: 'Test NFT 1', raw: {} },
          { tokenId: '2', name: 'Test NFT 2', raw: {} },
          { tokenId: '3', name: 'Test NFT 3', raw: {} },
        ],
      },
    });
    
    // Fill form
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), '1,2,3');
    
    // Add reference
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    // Validate
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(mockPostData).toHaveBeenCalledWith(
        expect.stringContaining('/api/rememes/validate'),
        expect.objectContaining({
          token_ids: ['1', '2', '3'],
        })
      );
    });
  });

  it('parses range token IDs correctly', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 200,
      response: {
        valid: true,
        contract: { name: 'Test Contract' },
        nfts: [
          { tokenId: '1', name: 'Test NFT 1', raw: {} },
          { tokenId: '2', name: 'Test NFT 2', raw: {} },
          { tokenId: '3', name: 'Test NFT 3', raw: {} },
        ],
      },
    });
    
    // Fill form
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), '1-3');
    
    // Add reference
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    // Validate
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(mockPostData).toHaveBeenCalledWith(
        expect.stringContaining('/api/rememes/validate'),
        expect.objectContaining({
          token_ids: ['1', '2', '3'],
        })
      );
    });
  });

  it('displays verification success state', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 200,
      response: {
        valid: true,
        contract: { name: 'Test Contract', contractDeployer: '0xdeployer' },
        nfts: [{ tokenId: '1', name: 'Test NFT', raw: {} }],
      },
    });
    
    // Fill form and validate
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), '1');
    
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeTruthy();
      expect(screen.getByText('Name: Test Contract')).toBeTruthy();
      expect(screen.getByText(/tokens/i)).toBeTruthy();
      expect(screen.getByText('#1 - Test NFT')).toBeTruthy();
    });
  });

  it('displays verification errors', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 400,
      response: {
        valid: false,
        error: 'Contract not found',
      },
    });
    
    // Fill form and validate
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), '1');
    
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeTruthy();
      expect(screen.getByText('- Contract not found')).toBeTruthy();
    });
  });

  it('handles invalid token IDs', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 200,
      response: {
        valid: false,
        error: 'Invalid token ID(s)',
        errors: ['Invalid token ID(s)'],
      },
    });
    
    // Fill form with invalid token IDs
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), 'invalid');
    
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeTruthy();
      expect(screen.getByText('- Invalid token ID(s)')).toBeTruthy();
    });
  });

  it('allows editing after verification', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    mockPostData.mockResolvedValue({
      status: 200,
      response: {
        valid: true,
        contract: { name: 'Test Contract' },
        nfts: [{ tokenId: '1', name: 'Test NFT', raw: {} }],
      },
    });
    
    // Fill form and validate
    await user.type(screen.getByPlaceholderText('0x...'), '0x1234567890123456789012345678901234567890');
    await user.type(screen.getByPlaceholderText(/1,2,3 or 1-3/), '1');
    
    const dropdownToggle = screen.getAllByRole('button').find(button => button.getAttribute('aria-expanded') === 'false');
    await user.click(dropdownToggle!);
    await user.click(screen.getByText('#1 - The Memes #1'));
    
    await user.click(screen.getByRole('button', { name: /validate/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/verified/i)).toBeTruthy();
    });
    
    // Click edit
    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(screen.getByRole('button', { name: /validate/i })).toBeTruthy();
    expect(mockVerifiedRememe).toHaveBeenCalledWith(undefined, []);
  });
});