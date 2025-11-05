import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RefObject } from 'react';
import UserPageCollectedFilters from '@/components/user/collected/filters/UserPageCollectedFilters';
import { CollectedCollectionType, CollectionSeized, CollectionSort } from '@/entities/IProfile';
import { MEMES_SEASON } from '@/enums';
import { ApiIdentity } from '@/generated/models/ApiIdentity';

// Mock the child components
jest.mock('@/components/user/collected/filters/UserPageCollectedFiltersCollection', () => {
  return function MockUserPageCollectedFiltersCollection({ selected, setSelected }: any) {
    return (
      <div data-testid="collection-filter">
        <button onClick={() => setSelected('memes')}>Collection Filter</button>
        Current: {selected || 'none'}
      </div>
    );
  };
});

jest.mock('@/components/user/collected/filters/UserPageCollectedFiltersSortBy', () => {
  return function MockUserPageCollectedFiltersSortBy({ selected, setSelected }: any) {
    return (
      <div data-testid="sort-by-filter">
        <button onClick={() => setSelected('card_id')}>Sort By Filter</button>
        Current: {selected || 'none'}
      </div>
    );
  };
});

jest.mock('@/components/user/collected/filters/UserPageCollectedFiltersSeized', () => {
  return function MockUserPageCollectedFiltersSeized({ selected, setSelected }: any) {
    return (
      <div data-testid="seized-filter">
        <button onClick={() => setSelected('seized')}>Seized Filter</button>
        Current: {selected || 'none'}
      </div>
    );
  };
});

jest.mock('@/components/user/collected/filters/UserPageCollectedFiltersSzn', () => {
  return function MockUserPageCollectedFiltersSzn({ selected, setSelected }: any) {
    return (
      <div data-testid="szn-filter">
        <button onClick={() => setSelected('SZN1')}>Season Filter</button>
        Current: {selected || 'none'}
      </div>
    );
  };
});

jest.mock('@/components/user/utils/addresses-select/UserAddressesSelectDropdown', () => {
  return function MockUserAddressesSelectDropdown({ wallets, onActiveAddress }: any) {
    return (
      <div data-testid="address-select">
        <button onClick={() => onActiveAddress('0x123')}>Address Select</button>
        Wallets: {wallets.length}
      </div>
    );
  };
});

// Mock the helpers
jest.mock('@/components/user/collected/filters/user-page-collected-filters.helpers', () => ({
  COLLECTED_COLLECTIONS_META: {
    memes: {
      filters: {
        seized: true,
        szn: true,
      },
    },
    gradients: {
      filters: {
        seized: false,
        szn: false,
      },
    },
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('UserPageCollectedFilters', () => {
  const mockProfile: ApiIdentity = {
    profile: {
      handle: 'testuser',
      normalised_handle: 'testuser',
      wallet: '0x123',
      display: 'Test User',
      pfp: null,
      pfp_url: null,
      cic: 0,
      rep: 0,
      tdh: 0,
      level: 1,
      consolidation_key: null,
      classification: null,
      sub_classification: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    },
    wallets: [
      { wallet: '0x123', type: 'PRIMARY' },
      { wallet: '0x456', type: 'SECONDARY' }
    ]
  };

  const mockFilters = {
    collection: null as CollectedCollectionType | null,
    sortBy: 'card_id' as CollectionSort,
    sortDirection: 'asc' as 'asc' | 'desc',
    seized: null as CollectionSeized | null,
    szn: null as MEMES_SEASON | null,
  };

  const mockSetters = {
    setCollection: jest.fn(),
    setSortBy: jest.fn(),
    setSeized: jest.fn(),
    setSzn: jest.fn(),
    showTransfer: false,
  };

  let mockContainerRef: RefObject<HTMLDivElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainerRef = {
      current: document.createElement('div')
    };
    
    globalThis.ResizeObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it('renders filters correctly', () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.getByTestId('collection-filter')).toBeInTheDocument();
    expect(screen.getByTestId('sort-by-filter')).toBeInTheDocument();
    expect(screen.getByTestId('address-select')).toBeInTheDocument();
  });

  it('shows seized filter when collection supports it', () => {
    const filtersWithMemes = { ...mockFilters, collection: 'memes' as CollectedCollectionType };
    
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={filtersWithMemes}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.getByTestId('seized-filter')).toBeInTheDocument();
  });

  it('shows season filter when collection supports it', () => {
    const filtersWithMemes = { ...mockFilters, collection: 'memes' as CollectedCollectionType };
    
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={filtersWithMemes}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.getByTestId('szn-filter')).toBeInTheDocument();
  });

  it('hides seized and season filters when collection does not support them', () => {
    const filtersWithGradients = { ...mockFilters, collection: 'gradients' as CollectedCollectionType };
    
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={filtersWithGradients}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(screen.queryByTestId('seized-filter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('szn-filter')).not.toBeInTheDocument();
  });

  it('calls setCollection when collection filter is used', () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    fireEvent.click(screen.getByText('Collection Filter'));
    expect(mockSetters.setCollection).toHaveBeenCalledWith('memes');
  });

  it('calls setSortBy when sort filter is used', () => {
    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    fireEvent.click(screen.getByText('Sort By Filter'));
    expect(mockSetters.setSortBy).toHaveBeenCalledWith('card_id');
  });

  it('shows scroll arrows when filters are not fully visible', async () => {
    const { container } = render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    await waitFor(() => {
      const scrollContainer = container.querySelector('[class*="tw-overflow-x-auto"]') as HTMLDivElement;
      expect(scrollContainer).toBeTruthy();
    });

    const scrollContainer = container.querySelector('[class*="tw-overflow-x-auto"]') as HTMLDivElement;
    if (!scrollContainer) {
      throw new Error('Scroll container not found');
    }

    await act(async () => {
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        writable: true,
        configurable: true,
        value: 50,
      });
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        writable: true,
        configurable: true,
        value: 300,
      });
      Object.defineProperty(scrollContainer, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 100,
      });

      const scrollEvent = new Event('scroll', { bubbles: true });
      scrollContainer.dispatchEvent(scrollEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Scroll filters left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll filters right')).toBeInTheDocument();
    });
  });

  it('calls scrollHorizontally when scroll arrows are clicked', async () => {
    const scrollBySpy = jest.fn();
    const { container } = render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    await waitFor(() => {
      const scrollContainer = container.querySelector('[class*="tw-overflow-x-auto"]') as HTMLDivElement;
      expect(scrollContainer).toBeTruthy();
    });

    const scrollContainer = container.querySelector('[class*="tw-overflow-x-auto"]') as HTMLDivElement;
    if (!scrollContainer) {
      throw new Error('Scroll container not found');
    }

    scrollContainer.scrollBy = scrollBySpy;

    await act(async () => {
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        writable: true,
        configurable: true,
        value: 50,
      });
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        writable: true,
        configurable: true,
        value: 300,
      });
      Object.defineProperty(scrollContainer, 'clientWidth', {
        writable: true,
        configurable: true,
        value: 100,
      });

      const scrollEvent = new Event('scroll', { bubbles: true });
      scrollContainer.dispatchEvent(scrollEvent);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Scroll filters left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll filters right')).toBeInTheDocument();
    });

    const leftArrow = screen.getByLabelText('Scroll filters left');
    const rightArrow = screen.getByLabelText('Scroll filters right');
    
    fireEvent.click(leftArrow);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: -150, behavior: 'smooth' });
    
    fireEvent.click(rightArrow);
    expect(scrollBySpy).toHaveBeenCalledWith({ left: 150, behavior: 'smooth' });
  });

  it('sets up event listeners on mount and cleans up on unmount', async () => {
    const addEventListenerSpy = jest.spyOn(HTMLDivElement.prototype, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(HTMLDivElement.prototype, 'removeEventListener');
    const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { container, unmount } = render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    await waitFor(() => {
      const scrollContainer = container.querySelector('[class*="tw-overflow-x-auto"]') as HTMLDivElement;
      expect(scrollContainer).toBeTruthy();
    });

    await waitFor(() => {
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    windowAddEventListenerSpy.mockRestore();
    windowRemoveEventListenerSpy.mockRestore();
  });

});