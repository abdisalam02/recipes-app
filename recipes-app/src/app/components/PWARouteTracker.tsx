"use client";

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function RouteTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const isInitialMount = useRef(true);

  useEffect(() => {
    // On app initialization, check for a saved route
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      try {
        const savedRoute = localStorage.getItem('pwa_last_route');
        
        // Only redirect if we are landing on the root AND we have a saved route that isn't the root
        if (pathname === '/' && savedRoute && savedRoute !== '/') {
          router.replace(savedRoute);
        }
      } catch (err) {
        // Silently ignore localStorage errors (e.g., in incognito)
      }
      return;
    }

    // On subsequent route changes, save the current full path to localStorage
    try {
      const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      localStorage.setItem('pwa_last_route', currentUrl);
    } catch (err) {
      // Silently ignore
    }
  }, [pathname, searchParams, router]);

  return null; // This component doesn't render anything
}

export function PWARouteTracker() {
  return (
    <Suspense fallback={null}>
      <RouteTrackerInner />
    </Suspense>
  );
}
