import { useCallback } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook for tracking feature interactions for analytics.
 *
 * Usage:
 *   const { trackFeature } = useFeatureTracking();
 *   trackFeature('goal_bank_opened', { domain: 'Auditory Skills' });
 *   trackFeature('session_logged', { minutes: 30, category: 'DirectService' });
 */
export function useFeatureTracking() {
  const trackFeature = useCallback((featureName, properties = {}) => {
    try {
      base44.analytics.track({
        eventName: `feature_${featureName}`,
        properties,
      });
    } catch (_) {
      // Never break the app due to analytics
    }
  }, []);

  return { trackFeature };
}