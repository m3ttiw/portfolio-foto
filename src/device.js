// Caratteristiche del dispositivo, lette una volta all'avvio.
export const isMobile = matchMedia('(max-width: 700px)').matches;
export const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
