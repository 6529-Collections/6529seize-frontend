import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Crumb } from '../components/breadcrumb/Breadcrumb'; // Adjust path if needed
import { fetchUrl } from '../services/6529api'; // Adjust path if needed

// Helper function to format path segments
const formatCrumbDisplay = (segment: string): string => {
  if (!segment) return '';
  return segment
    .split('-')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '')
    .join(' ');
};

// --- API Fetcher Functions --- 
// Define functions to fetch minimal data needed for display names

const fetchGradientName = async (id: string): Promise<{ name: string } | null> => {
  if (!id || typeof id !== 'string') return null;
  try {
    // TODO: Optimize API call if possible (e.g., dedicated endpoint or field selection)
    const response = await fetchUrl(`${process.env.API_ENDPOINT}/api/nfts/gradients?id=${id}`);
    const nftData = (response as any)?.data?.[0]; // Use safe parsing
    return nftData ? { name: nftData.name } : null;
  } catch (error) {
    console.error(`Failed to fetch gradient name for breadcrumb (ID: ${id})`, error);
    return { name: `Gradient ${id}` }; // Fallback
  }
};

// Example: Fetch profile data (replace with actual implementation)
const fetchProfileHandle = async (handle: string): Promise<{ handle: string } | null> => {
  if (!handle || typeof handle !== 'string') return null;
   try {
     // Replace with actual API call for profile display name/handle
     // const response = await fetchUrl(`${process.env.API_ENDPOINT}/api/profile/${handle}`);
     // const profile = (response as any)?.data;
     // return profile ? { handle: profile.display_name ?? profile.handle } : null;
     await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
     return { handle: handle }; // Placeholder
   } catch (error) {
     console.error(`Failed to fetch profile handle for breadcrumb: ${handle}`, error);
     return { handle: handle }; // Fallback
   }
 };

// --- Add more fetchers for other dynamic route types --- 

// --- Main Hook --- 
export const useBreadcrumbs = (): Crumb[] => {
  const router = useRouter();
  const { pathname, query } = router;

  // Base crumb: Always start with Home
  const baseCrumbs: Crumb[] = useMemo(() => [{ display: 'Home', href: '/' }], []);

  // Determine route type and fetch data conditionally
  const pathSegments = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const dynamicRouteConfig = useMemo(() => {
    if (pathname.startsWith('/6529-gradient/') && pathSegments.length === 2 && query.id) {
      return { type: 'gradient', id: query.id as string };
    } 
    if (pathname.startsWith('/profile/') && pathSegments.length === 2 && query.handle) {
        return { type: 'profile', handle: query.handle as string };
    }
    // --- Add more 'else if' conditions for other dynamic routes here ---
    // e.g., /the-memes/[id], /collection/[contract]/[id], etc.

    return { type: 'static' }; // Default for non-matching or static routes
  }, [pathname, pathSegments, query]);

  // --- React Query Hooks (Conditional) ---
  const { data: gradientData, isLoading: isLoadingGradient } = useQuery({
    queryKey: ['breadcrumb', 'gradient', dynamicRouteConfig.type === 'gradient' ? dynamicRouteConfig.id : 'invalid'],
    queryFn: () => {
      if (dynamicRouteConfig.type === 'gradient' && dynamicRouteConfig.id) {
        return fetchGradientName(dynamicRouteConfig.id);
      }
      return Promise.resolve(null);
    },
    enabled: dynamicRouteConfig.type === 'gradient' && !!dynamicRouteConfig.id, // Ensure id is truthy
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
      queryKey: ['breadcrumb', 'profile', dynamicRouteConfig.type === 'profile' ? dynamicRouteConfig.handle : 'invalid'],
      queryFn: () => {
         if (dynamicRouteConfig.type === 'profile' && dynamicRouteConfig.handle) {
           return fetchProfileHandle(dynamicRouteConfig.handle);
         }
         return Promise.resolve(null);
       },      
       enabled: dynamicRouteConfig.type === 'profile' && !!dynamicRouteConfig.handle, // Ensure handle is truthy
      staleTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    });

  // --- Add more useQuery hooks corresponding to fetchers and route types --- 

  // --- Assemble Crumbs --- 
  const finalCrumbs = useMemo(() => {
    const generatedCrumbs: Crumb[] = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      let display = formatCrumbDisplay(segment);
      const isLastSegment = index === pathSegments.length - 1;

      // Override display name for the last segment if it's dynamic and data is ready
      if (isLastSegment) {
        switch (dynamicRouteConfig.type) {
          case 'gradient': {
            // Check for existence of id within the case block for TS
            const id = dynamicRouteConfig.id; 
            if (id) { 
              if (isLoadingGradient) display = `Loading #${id}...`;
              else if (gradientData?.name) display = gradientData.name;
              else display = `Gradient ${id}`; // Fallback
            }
            break;
          }
          case 'profile': {
            // Check for existence of handle within the case block for TS
            const handle = dynamicRouteConfig.handle;
            if (handle) {
              if (isLoadingProfile) display = `Loading ${handle}...`;
              else if (profileData?.handle) display = profileData.handle; // Use fetched handle/name
              else display = handle; // Fallback
            }
            break;
          }
          // --- Add more cases for other dynamic route types --- 
        }
      }

      // Add href only if it's not the last segment
      if (!isLastSegment) {
        generatedCrumbs.push({ display, href: currentPath });
      } else {
        generatedCrumbs.push({ display });
      }
    });

    // Combine base and generated crumbs, handling the root path case
    return generatedCrumbs.length > 0 ? [...baseCrumbs, ...generatedCrumbs] : baseCrumbs;
  }, [
    baseCrumbs,
    pathSegments,
    dynamicRouteConfig,
    gradientData,
    isLoadingGradient,
    profileData,
    isLoadingProfile,
    // Add other query data/loading states as dependencies
  ]);

  return finalCrumbs;
}; 