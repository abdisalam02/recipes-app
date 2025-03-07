export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker
        .register('/sw.js')
        .then(function(registration) {
          console.log('PWA: ServiceWorker registration successful with scope: ', registration.scope);
          
          // Log when a new service worker is found
          registration.addEventListener('updatefound', () => {
            console.log('PWA: New service worker being installed...');
          });
        })
        .catch(function(err) {
          console.error('PWA: ServiceWorker registration failed: ', err);
        });
    });

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA: Install prompt is available');
      // Optionally, store the event to trigger it later
      // e.preventDefault();
      // window.deferredPrompt = e;
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', (evt) => {
      console.log('PWA: Application was installed');
    });
  }
} 