import { useState, useEffect, useMemo } from "react";
import { ApiProfileMin } from "../generated/models/ApiProfileMin";

export interface ArtSubmission {
  id: string;
  imageUrl: string;
  title?: string;
  createdAt: number;
}

interface UseUserArtSubmissionsResult {
  submissions: ArtSubmission[];
  submissionCount: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage user art submissions
 * Currently uses mock data - replace with actual API calls
 */
export function useUserArtSubmissions(
  user: ApiProfileMin | null | undefined
): UseUserArtSubmissionsResult {
  const [submissions, setSubmissions] = useState<ArtSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with actual API logic
  const mockSubmissions = useMemo(() => {
    if (!user) return [];
    
    // Environment variable overrides for testing
    const SHOW_ALL_BADGES = process.env.NEXT_PUBLIC_SHOW_ALL_ART_BADGES === 'true';
    const BADGE_PERCENTAGE = parseInt(process.env.NEXT_PUBLIC_ART_BADGE_PERCENTAGE || '30');
    
    // If testing mode is enabled, show badges for all users
    if (SHOW_ALL_BADGES) {
      console.log(`[ArtSubmissions] SHOW_ALL_BADGES mode enabled for ${user.handle}`);
    }
    
    // Expanded mock logic for better testing - more users will have submissions
    const hasSubmissions = SHOW_ALL_BADGES || (
      // Original conditions
      user.handle?.toLowerCase().startsWith('a') || 
      user.handle?.toLowerCase().includes('art') ||
      user.id === 'mock-artist-id' ||
      
      // New conditions for broader testing
      user.level >= 5 || // Users with level 5+ are artists
      user.cic >= 100 || // Users with high CIC scores
      user.rep >= 50 || // Users with high rep
      user.handle?.toLowerCase().includes('creative') ||
      user.handle?.toLowerCase().includes('design') ||
      user.handle?.toLowerCase().includes('draw') ||
      user.handle?.toLowerCase().includes('paint') ||
      user.handle?.toLowerCase().includes('nft') ||
      
      // Pattern-based: users with numbers in handle (common pattern)
      /\d/.test(user.handle || '') ||
      
      // Configurable random selection (default 30% of remaining users)
      (user.id && parseInt(user.id.slice(-2), 16) % 100 < BADGE_PERCENTAGE)
    );
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ArtSubmissions] User: ${user.handle || 'Unknown'} (ID: ${user.id})`, {
        level: user.level,
        cic: user.cic,
        rep: user.rep,
        hasSubmissions,
        conditions: {
          startsWithA: user.handle?.toLowerCase().startsWith('a'),
          containsArt: user.handle?.toLowerCase().includes('art'),
          isHighLevel: user.level >= 5,
          isHighCIC: user.cic >= 100,
          isHighRep: user.rep >= 50,
          hasNumbers: /\d/.test(user.handle || ''),
          randomSelection: user.id && parseInt(user.id.slice(-2), 16) % 10 < 3
        }
      });
    }
    
    if (!hasSubmissions) return [];

    // Generate varied mock submissions based on user properties
    const submissions: ArtSubmission[] = [];
    
    // Real art images from Unsplash for more realistic preview
    const artImages = [
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&crop=center', // Abstract colorful
      'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop&crop=center', // Digital art
      'https://images.unsplash.com/photo-1569437061238-3cf61084f6de?w=400&h=400&fit=crop&crop=center', // Neon city
      'https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=400&h=400&fit=crop&crop=center', // Abstract waves
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center', // Space art
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&h=400&fit=crop&crop=center', // Cyberpunk
      'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=400&fit=crop&crop=center', // Geometric
      'https://images.unsplash.com/photo-1508919801845-fc2ae1bc2a28?w=400&h=400&fit=crop&crop=center', // Liquid art
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop&crop=center', // Purple abstract
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&crop=center', // Orange abstract
      'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=400&fit=crop&crop=center', // Blue waves
      'https://images.unsplash.com/photo-1540270776932-e72e7c2d11cd?w=400&h=400&fit=crop&crop=center', // Gradient art
    ];
    
    const artTypes = ['Abstract', 'Digital', 'Pixel', 'Vector', 'Generative', 'Glitch', 'Surreal', 'Neon'];
    const subjects = ['Landscape', 'Dreams', 'City', 'Ocean', 'Space', 'Forest', 'Waves', 'Portal'];
    
    // Determine number of submissions based on user stats
    let submissionCount = 1;
    if (user.level >= 8 || user.cic >= 200) submissionCount = 3;
    else if (user.level >= 6 || user.cic >= 150) submissionCount = 2;
    else if (SHOW_ALL_BADGES) submissionCount = Math.floor(Math.random() * 3) + 1; // 1-3 for testing
    
    for (let i = 0; i < submissionCount; i++) {
      // Use user ID hash to consistently select same images for same user
      const imageIndex = (user.id.charCodeAt(i % user.id.length) + i) % artImages.length;
      const artIndex = (user.level + i) % artTypes.length;
      const subjectIndex = (user.cic + i * 2) % subjects.length;
      
      submissions.push({
        id: `${user.id}-${i + 1}`,
        imageUrl: artImages[imageIndex],
        title: `${artTypes[artIndex]} ${subjects[subjectIndex]}${i > 0 ? ` ${i + 1}` : ''}`,
        createdAt: Date.now() - (86400000 * (i + 1)), // 1 day apart
      });
    }

    return submissions;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call delay
    const timer = setTimeout(() => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/users/${user.id}/art-submissions`);
        // const data = await response.json();
        
        setSubmissions(mockSubmissions);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
        setIsLoading(false);
      }
    }, 100); // Minimal delay to simulate network

    return () => clearTimeout(timer);
  }, [user, mockSubmissions]);

  return {
    submissions,
    submissionCount: submissions.length,
    isLoading,
    error,
  };
}

/**
 * Hook to check if a user has any art submissions (lightweight version)
 * Use this when you only need to know if badges should be shown
 */
export function useHasArtSubmissions(
  user: ApiProfileMin | null | undefined
): boolean {
  const { submissionCount } = useUserArtSubmissions(user);
  return submissionCount > 0;
}