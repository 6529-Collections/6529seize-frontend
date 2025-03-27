/**
 * Format timestamp into readable countdown or date
 * @param timestamp Future timestamp in milliseconds or null
 * @returns Formatted string for display
 */
export function formatCountdown(timestamp: number | null): string {
  if (!timestamp) return "";
  
  const now = Date.now();
  const timeRemaining = timestamp - now;
  
  // Already passed
  if (timeRemaining <= 0) return "Now";
  
  // Less than a day
  if (timeRemaining < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours === 0) return `in ${minutes}m`;
    return `in ${hours}h ${minutes}m`;
  }
  
  // Less than a week
  if (timeRemaining < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `in ${days}d ${hours}h`;
  }
  
  // Format as date for distant future
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}