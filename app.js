// You can add interactive features here later
console.log("Oh My Raffle site loaded!");
// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/oh-my-raffle/sw.js', { scope: '/oh-my-raffle/' })
    .catch(err => console.log('SW registration failed:', err));
}
