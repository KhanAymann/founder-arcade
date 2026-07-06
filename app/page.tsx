import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home-shell">
      <section className="panel hero-panel">
        <p className="eyebrow">Week 03 • Interactive Game</p>
        <h1>Founder Arcade</h1>
        <p className="lead">
          Make money. Lose energy. Survive pitch night.
        </p>
        <Link href="/founder-arcade" className="button primary-button">
          Play the game
        </Link>
      </section>
    </main>
  );
}
