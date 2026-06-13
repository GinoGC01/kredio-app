const blobs = document.querySelectorAll('.blob');
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!isMobile && !prefersReduced) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    blobs.forEach((blob, i) => {
      const depth = (i + 1) * 12;
      blob.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
    });
  }, { passive: true });
}
