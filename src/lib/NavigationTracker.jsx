import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';
import { pagesConfig } from '@/pages.config';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    // Log user activity when navigating to a page
    useEffect(() => {
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];

            // First try pagesConfig lookup (case-insensitive)
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );

            // Fall back to the raw path segment for routes outside pagesConfig (Join, DistrictPricing, etc.)
            pageName = matchedKey || pathSegment || null;
        }

        if (isAuthenticated && pageName) {
            base44.appLogs.logUserInApp(pageName).catch(() => {});
        }

        if (pageName) {
            base44.analytics.track({
                eventName: "page_view",
                properties: {
                    page: pageName,
                    path: pathname,
                    authenticated: isAuthenticated,
                },
            });
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}