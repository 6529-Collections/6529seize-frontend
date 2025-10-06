import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    scrollHorizontally: jest.fn(),
  };

  let mockContainerRef: RefObject<HTMLDivElement>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContainerRef = {
      current: document.createElement('div')
    };
    
    // Setup mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 50,
      width: 100,
      height: 50,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
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
    // Mock checkVisibility to return false (not visible)
    const mockGetBoundingClientRect = jest.fn()
      // First call - container getBoundingClientRect
      .mockReturnValueOnce({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() })
      // Second call - mostLeftFilter getBoundingClientRect  
      .mockReturnValueOnce({ left: -50, right: -10, width: 40, height: 30, top: 0, bottom: 30, x: -50, y: 0, toJSON: jest.fn() })
      // Third call - container getBoundingClientRect again
      .mockReturnValueOnce({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() })
      // Fourth call - mostRightFilter getBoundingClientRect
      .mockReturnValueOnce({ left: 150, right: 200, width: 50, height: 30, top: 0, bottom: 30, x: 150, y: 0, toJSON: jest.fn() })
      // Fifth call - container getBoundingClientRect again
      .mockReturnValueOnce({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() })
      // Default return for any other calls
      .mockReturnValue({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() });

    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Scroll filters left')).toBeInTheDocument();
      expect(screen.getByLabelText('Scroll filters right')).toBeInTheDocument();
    });
  });

  it('calls scrollHorizontally when scroll arrows are clicked', async () => {
    // Mock to show arrows
    const mockGetBoundingClientRect = jest.fn()
      // First call - container getBoundingClientRect
      .mockReturnValueOnce({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() })
      // Second call - mostLeftFilter getBoundingClientRect  
      .mockReturnValueOnce({ left: -50, right: -10, width: 40, height: 30, top: 0, bottom: 30, x: -50, y: 0, toJSON: jest.fn() })
      // Third call - container getBoundingClientRect again
      .mockReturnValueOnce({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() })
      // Fourth call - mostRightFilter getBoundingClientRect
      .mockReturnValueOnce({ left: 150, right: 200, width: 50, height: 30, top: 0, bottom: 30, x: 150, y: 0, toJSON: jest.fn() })
      // Fifth call - container getBoundingClientRect again
      .mockReturnValueOnce({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() })
      // Default return for any other calls
      .mockReturnValue({ left: 0, right: 100, width: 100, height: 30, top: 0, bottom: 30, x: 0, y: 0, toJSON: jest.fn() });

    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    await waitFor(() => {
      const leftArrow = screen.getByLabelText('Scroll filters left');
      const rightArrow = screen.getByLabelText('Scroll filters right');
      
      fireEvent.click(leftArrow);
      expect(mockSetters.scrollHorizontally).toHaveBeenCalledWith('left');
      
      fireEvent.click(rightArrow);
      expect(mockSetters.scrollHorizontally).toHaveBeenCalledWith('right');
    });
  });

  it('sets up event listeners on mount and cleans up on unmount', () => {
    const addEventListenerSpy = jest.spyOn(mockContainerRef.current!, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(mockContainerRef.current!, 'removeEventListener');
    const windowAddEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const windowRemoveEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('handles mobile touch device detection correctly', () => {
    // Mock matchMedia to return true for touch devices
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(pointer: coarse)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <UserPageCollectedFilters
        profile={mockProfile}
        filters={mockFilters}
        containerRef={mockContainerRef}
        {...mockSetters}
      />
    );

    // On touch devices, arrows should not be shown
    expect(screen.queryByLabelText('Scroll filters left')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Scroll filters right')).not.toBeInTheDocument();
  });
});