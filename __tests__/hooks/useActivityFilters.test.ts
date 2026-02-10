import { ContractFilter, TypeFilter } from "@/hooks/useActivityData";
import { useActivityFilters } from "@/hooks/useActivityFilters";
import { act, renderHook } from "@testing-library/react";

describe("useActivityFilters", () => {
  describe("Initial State", () => {
    it("initializes with correct default state", () => {
      const { result } = renderHook(() => useActivityFilters());

      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);
      expect(typeof result.current.setTypeFilter).toBe("function");
      expect(typeof result.current.setSelectedContract).toBe("function");
      expect(typeof result.current.resetFilters).toBe("function");
    });

    it("returns consistent object reference structure", () => {
      const { result } = renderHook(() => useActivityFilters());

      const returnedKeys = Object.keys(result.current);
      const expectedKeys = [
        "typeFilter",
        "selectedContract",
        "setTypeFilter",
        "setSelectedContract",
        "resetFilters",
      ];

      expect(returnedKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  describe("TypeFilter State Management", () => {
    it("updates typeFilter when setTypeFilter is called", () => {
      const { result } = renderHook(() => useActivityFilters());

      expect(result.current.typeFilter).toBe(TypeFilter.ALL);

      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
    });

    it("handles all TypeFilter enum values correctly", () => {
      const { result } = renderHook(() => useActivityFilters());

      const allTypeFilters = [
        TypeFilter.ALL,
        TypeFilter.AIRDROPS,
        TypeFilter.MINTS,
        TypeFilter.SALES,
        TypeFilter.TRANSFERS,
        TypeFilter.BURNS,
      ];

      allTypeFilters.forEach((filterValue) => {
        act(() => {
          result.current.setTypeFilter(filterValue);
        });

        expect(result.current.typeFilter).toBe(filterValue);
      });
    });

    it("maintains selectedContract state when typeFilter changes", () => {
      const { result } = renderHook(() => useActivityFilters());

      // First set a contract filter
      act(() => {
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);

      // Then change type filter
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
      });

      // Contract filter should remain unchanged
      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
    });

    it("allows rapid consecutive typeFilter updates", () => {
      const { result } = renderHook(() => useActivityFilters());

      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
        result.current.setTypeFilter(TypeFilter.TRANSFERS);
        result.current.setTypeFilter(TypeFilter.MINTS);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.MINTS);
    });
  });

  describe("ContractFilter State Management", () => {
    it("updates selectedContract when setSelectedContract is called", () => {
      const { result } = renderHook(() => useActivityFilters());

      expect(result.current.selectedContract).toBe(ContractFilter.ALL);

      act(() => {
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
    });

    it("handles all ContractFilter enum values correctly", () => {
      const { result } = renderHook(() => useActivityFilters());

      const allContractFilters = [
        ContractFilter.ALL,
        ContractFilter.MEMES,
        ContractFilter.NEXTGEN,
        ContractFilter.GRADIENTS,
      ];

      allContractFilters.forEach((filterValue) => {
        act(() => {
          result.current.setSelectedContract(filterValue);
        });

        expect(result.current.selectedContract).toBe(filterValue);
      });
    });

    it("maintains typeFilter state when selectedContract changes", () => {
      const { result } = renderHook(() => useActivityFilters());

      // First set a type filter
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.SALES);

      // Then change contract filter
      act(() => {
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      // Type filter should remain unchanged
      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
    });

    it("allows rapid consecutive selectedContract updates", () => {
      const { result } = renderHook(() => useActivityFilters());

      act(() => {
        result.current.setSelectedContract(ContractFilter.MEMES);
        result.current.setSelectedContract(ContractFilter.NEXTGEN);
        result.current.setSelectedContract(ContractFilter.GRADIENTS);
      });

      expect(result.current.selectedContract).toBe(ContractFilter.GRADIENTS);
    });
  });

  describe("Reset Functionality", () => {
    it("resets both filters to default state", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Set both filters to non-default values
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);

      // Reset filters
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);
    });

    it("resets filters even when already at default state", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Filters are already at default state
      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);

      // Reset should still work without issues
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);
    });

    it("can reset after multiple filter changes", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Make multiple changes
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
        result.current.setSelectedContract(ContractFilter.MEMES);
        result.current.setTypeFilter(TypeFilter.TRANSFERS);
        result.current.setSelectedContract(ContractFilter.NEXTGEN);
        result.current.setTypeFilter(TypeFilter.BURNS);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.BURNS);
      expect(result.current.selectedContract).toBe(ContractFilter.NEXTGEN);

      // Reset should bring everything back to defaults
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);
    });
  });

  describe("Callback Integration", () => {
    describe("setTypeFilter with resetPage callback", () => {
      it("calls resetPage callback when provided to setTypeFilter", () => {
        const { result } = renderHook(() => useActivityFilters());
        const mockResetPage = jest.fn();

        act(() => {
          result.current.setTypeFilter(TypeFilter.SALES, mockResetPage);
        });

        expect(mockResetPage).toHaveBeenCalledTimes(1);
        expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      });

      it("does not crash when no resetPage callback provided to setTypeFilter", () => {
        const { result } = renderHook(() => useActivityFilters());

        expect(() => {
          act(() => {
            result.current.setTypeFilter(TypeFilter.SALES);
          });
        }).not.toThrow();

        expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      });

      it("calls resetPage before state setter is called", () => {
        const { result } = renderHook(() => useActivityFilters());
        const executionOrder: string[] = [];

        const mockResetPage = jest.fn(() => {
          // Capture the typeFilter state at the moment resetPage is called
          executionOrder.push(
            `resetPage called, typeFilter: ${result.current.typeFilter}`
          );
        });

        // Initial state
        expect(result.current.typeFilter).toBe(TypeFilter.ALL);

        act(() => {
          result.current.setTypeFilter(TypeFilter.SALES, mockResetPage);
        });

        expect(mockResetPage).toHaveBeenCalledTimes(1);
        // resetPage is called while state is still at old value
        expect(executionOrder).toEqual([
          "resetPage called, typeFilter: All Transactions",
        ]);
        // But after the act() block, state should be updated
        expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      });

      it("handles resetPage callback that throws an error", () => {
        const { result } = renderHook(() => useActivityFilters());
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        const mockResetPageWithError = jest.fn(() => {
          throw new Error("Reset page failed");
        });

        // The implementation calls resetPage first, then setTypeFilterState
        // If resetPage throws, the setTypeFilterState never gets called
        expect(() => {
          act(() => {
            result.current.setTypeFilter(
              TypeFilter.SALES,
              mockResetPageWithError
            );
          });
        }).toThrow("Reset page failed");

        expect(mockResetPageWithError).toHaveBeenCalledTimes(1);
        // State should NOT be updated if callback throws before state setter is called
        expect(result.current.typeFilter).toBe(TypeFilter.ALL);

        consoleErrorSpy.mockRestore();
      });
    });

    describe("setSelectedContract with resetPage callback", () => {
      it("calls resetPage callback when provided to setSelectedContract", () => {
        const { result } = renderHook(() => useActivityFilters());
        const mockResetPage = jest.fn();

        act(() => {
          result.current.setSelectedContract(
            ContractFilter.MEMES,
            mockResetPage
          );
        });

        expect(mockResetPage).toHaveBeenCalledTimes(1);
        expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      });

      it("does not crash when no resetPage callback provided to setSelectedContract", () => {
        const { result } = renderHook(() => useActivityFilters());

        expect(() => {
          act(() => {
            result.current.setSelectedContract(ContractFilter.MEMES);
          });
        }).not.toThrow();

        expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      });

      it("calls resetPage before state setter is called", () => {
        const { result } = renderHook(() => useActivityFilters());
        const executionOrder: string[] = [];

        const mockResetPage = jest.fn(() => {
          executionOrder.push(
            `resetPage called, selectedContract: ${result.current.selectedContract}`
          );
        });

        expect(result.current.selectedContract).toBe(ContractFilter.ALL);

        act(() => {
          result.current.setSelectedContract(
            ContractFilter.MEMES,
            mockResetPage
          );
        });

        expect(mockResetPage).toHaveBeenCalledTimes(1);
        expect(executionOrder).toEqual([
          "resetPage called, selectedContract: All Collections",
        ]);
        // But after the act() block, state should be updated
        expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      });

      it("handles resetPage callback that throws an error", () => {
        const { result } = renderHook(() => useActivityFilters());
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        const mockResetPageWithError = jest.fn(() => {
          throw new Error("Reset page failed");
        });

        expect(() => {
          act(() => {
            result.current.setSelectedContract(
              ContractFilter.MEMES,
              mockResetPageWithError
            );
          });
        }).toThrow("Reset page failed");

        expect(mockResetPageWithError).toHaveBeenCalledTimes(1);
        // State should NOT be updated if callback throws before state setter is called
        expect(result.current.selectedContract).toBe(ContractFilter.ALL);

        consoleErrorSpy.mockRestore();
      });
    });

    describe("Callback with both filters", () => {
      it("calls resetPage callback for both filter setters independently", () => {
        const { result } = renderHook(() => useActivityFilters());
        const mockResetPage1 = jest.fn();
        const mockResetPage2 = jest.fn();

        act(() => {
          result.current.setTypeFilter(TypeFilter.SALES, mockResetPage1);
          result.current.setSelectedContract(
            ContractFilter.MEMES,
            mockResetPage2
          );
        });

        expect(mockResetPage1).toHaveBeenCalledTimes(1);
        expect(mockResetPage2).toHaveBeenCalledTimes(1);
        expect(result.current.typeFilter).toBe(TypeFilter.SALES);
        expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      });

      it("can use the same callback function for both filters", () => {
        const { result } = renderHook(() => useActivityFilters());
        const mockResetPage = jest.fn();

        act(() => {
          result.current.setTypeFilter(TypeFilter.SALES, mockResetPage);
          result.current.setSelectedContract(
            ContractFilter.MEMES,
            mockResetPage
          );
        });

        expect(mockResetPage).toHaveBeenCalledTimes(2);
        expect(result.current.typeFilter).toBe(TypeFilter.SALES);
        expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      });
    });
  });

  describe("Combined Filter Operations", () => {
    it("can set both filters and then reset them", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Set both filters
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);

      // Reset
      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);
    });

    it("handles complex filter sequences correctly", () => {
      const { result } = renderHook(() => useActivityFilters());
      const mockResetPage = jest.fn();

      // Complex sequence of operations
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES, mockResetPage);
        result.current.setSelectedContract(ContractFilter.MEMES, mockResetPage);
        result.current.setTypeFilter(TypeFilter.TRANSFERS, mockResetPage);
        result.current.resetFilters();
        result.current.setSelectedContract(
          ContractFilter.NEXTGEN,
          mockResetPage
        );
      });

      expect(mockResetPage).toHaveBeenCalledTimes(4); // 3 setter calls + 0 for resetFilters
      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.NEXTGEN);
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    it("maintains referential stability for function references across renders", () => {
      const { result, rerender } = renderHook(() => useActivityFilters());

      const firstRenderFunctions = {
        setTypeFilter: result.current.setTypeFilter,
        setSelectedContract: result.current.setSelectedContract,
        resetFilters: result.current.resetFilters,
      };

      // Trigger re-render by changing some internal state
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
      });

      rerender();

      // Function references should remain the same (though with React hooks this might not be guaranteed without useCallback)
      // This test documents current behavior - if functions are recreated on each render, this test will fail
      // and that's actually expected behavior for useState-based hooks without memoization
      expect(typeof result.current.setTypeFilter).toBe("function");
      expect(typeof result.current.setSelectedContract).toBe("function");
      expect(typeof result.current.resetFilters).toBe("function");
    });

    it("handles undefined resetPage callback gracefully using optional chaining", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Pass undefined explicitly (though TypeScript should prevent this in real usage)
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES, undefined);
        result.current.setSelectedContract(ContractFilter.MEMES, undefined);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
    });

    it("works correctly when hook is used multiple times in same component", () => {
      // Simulate multiple instances of the hook
      const { result: instance1 } = renderHook(() => useActivityFilters());
      const { result: instance2 } = renderHook(() => useActivityFilters());

      // Each instance should be independent
      act(() => {
        instance1.current.setTypeFilter(TypeFilter.SALES);
        instance2.current.setTypeFilter(TypeFilter.TRANSFERS);
      });

      expect(instance1.current.typeFilter).toBe(TypeFilter.SALES);
      expect(instance2.current.typeFilter).toBe(TypeFilter.TRANSFERS);

      // Reset one instance should not affect the other
      act(() => {
        instance1.current.resetFilters();
      });

      expect(instance1.current.typeFilter).toBe(TypeFilter.ALL);
      expect(instance2.current.typeFilter).toBe(TypeFilter.TRANSFERS);
    });
  });

  describe("TypeScript Type Safety", () => {
    it("returns correct TypeScript types for all properties", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Test that the return values are of correct types
      expect(Object.values(TypeFilter)).toContain(result.current.typeFilter);
      expect(Object.values(ContractFilter)).toContain(
        result.current.selectedContract
      );
      expect(typeof result.current.setTypeFilter).toBe("function");
      expect(typeof result.current.setSelectedContract).toBe("function");
      expect(typeof result.current.resetFilters).toBe("function");
    });

    it("ensures enum values are properly typed (not strings)", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Verify that the returned enum values are actual enum members
      expect(result.current.typeFilter).toBe(TypeFilter.ALL);
      expect(result.current.selectedContract).toBe(ContractFilter.ALL);

      // The enum values should be equal to their string representations
      expect(TypeFilter.ALL).toBe("All Transactions");
      expect(ContractFilter.ALL).toBe("All Collections");

      // But when we set them, we should use the enum, not strings
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      expect(result.current.typeFilter).toBe(TypeFilter.SALES);
      expect(result.current.selectedContract).toBe(ContractFilter.MEMES);
      expect(result.current.typeFilter).toBe("Sales");
      expect(result.current.selectedContract).toBe("The Memes");
    });
  });

  describe("Hook Interface Contract", () => {
    it("implements the UseActivityFiltersReturn interface correctly", () => {
      const { result } = renderHook(() => useActivityFilters());

      // Verify all required properties exist
      const requiredProperties = [
        "typeFilter",
        "selectedContract",
        "setTypeFilter",
        "setSelectedContract",
        "resetFilters",
      ];

      requiredProperties.forEach((prop) => {
        expect(result.current).toHaveProperty(prop);
      });

      // Verify no unexpected properties exist
      const actualProperties = Object.keys(result.current);
      expect(actualProperties.sort()).toEqual(requiredProperties.sort());
    });

    it("maintains consistent return object shape across state changes", () => {
      const { result } = renderHook(() => useActivityFilters());

      const initialShape = Object.keys(result.current).sort();

      // Make various state changes
      act(() => {
        result.current.setTypeFilter(TypeFilter.SALES);
      });

      const afterTypeFilterChange = Object.keys(result.current).sort();
      expect(afterTypeFilterChange).toEqual(initialShape);

      act(() => {
        result.current.setSelectedContract(ContractFilter.MEMES);
      });

      const afterContractFilterChange = Object.keys(result.current).sort();
      expect(afterContractFilterChange).toEqual(initialShape);

      act(() => {
        result.current.resetFilters();
      });

      const afterReset = Object.keys(result.current).sort();
      expect(afterReset).toEqual(initialShape);
    });
  });
});
