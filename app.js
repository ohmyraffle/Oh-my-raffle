// Register Service Worker for GitHub Pages project site
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/oh-my-raffle/sw.js', { scope: '/oh-my-raffle/' })
    .then(() => console.log('SW registered'))
    .catch(err => console.log('SW registration failed:', err));
}
