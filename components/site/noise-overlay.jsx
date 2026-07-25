/**
 * NoiseOverlay — fixed, decorative film-grain layer. Purely presentational:
 * aria-hidden, pointer-events-none, sits above backgrounds but below content
 * via a low z-index. Adds the subtle "expensive" texture that separates a
 * rendered UI from a flat one. Drop once near the root.
 */
export function NoiseOverlay() {
  return <div className="noise-overlay" aria-hidden="true" />;
}

export default NoiseOverlay;