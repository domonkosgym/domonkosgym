import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * TrackingWrapper component that initializes analytics tracking for all pages.
 * Place this component at the root of your app to enable automatic page view tracking.
 */
export const TrackingWrapper = ({ children }: { children: React.ReactNode }) => {
  // Initialize analytics hook to track page views
  useAnalytics();
  
  return <>{children}</>;
};
