/**
 * Lightweight static galaxy background.
 * Purely decorative — never interactive, always behind the page content.
 */
export function AmbientBackground() {
  const stars = Array.from({ length: 56 }, (_, i) => ({
    id: i,
    left: (i * 47.3) % 100,
    top: (i * 26.9) % 100,
    size: 1 + ((i * 3) % 3) * 0.45,
    gold: i % 11 === 0,
  }));

  return (
    <div aria-hidden className="ambient-root">
      <div className="ambient-nebula" />
      <div className="star-layer">
        {stars.map((star) => (
        <span
          key={star.id}
          className={star.gold ? "star star-gold" : "star"}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
          }}
        />
      ))}
      </div>
    </div>
  );
}

export default AmbientBackground;
