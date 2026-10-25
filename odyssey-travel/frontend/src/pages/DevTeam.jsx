import { Link } from 'react-router-dom'

const contributions = [
  {
    number: '01',
    title: 'Product & experience',
    description: 'Shaping a clear, welcoming path from inspiration to a planned journey.',
  },
  {
    number: '02',
    title: 'Engineering',
    description: 'Building the search, trip planning, account, and booking experience.',
  },
  {
    number: '03',
    title: 'Travel research',
    description: 'Bringing destination ideas, practical details, and local context together.',
  },
]

export default function DevTeam() {
  return (
    <main className="dev-team-page">
      <header className="dev-team-heading">
        <p className="eyebrow dark">THE PEOPLE BEHIND THE JOURNEY</p>
        <h1>Made for the curious.</h1>
        <p>Odyssey Travel brings thoughtful design, useful technology, and a love of discovery into one place.</p>
      </header>

      <section className="dev-team-grid" aria-label="Odyssey Travel team contributions">
        {contributions.map((item) => (
          <article className="dev-team-card" key={item.number}>
            <span>{item.number}</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <p className="dev-team-note">A small team with a wide horizon.</p>
      <Link className="team-explore-link" to="/destinations">Explore destinations <span aria-hidden="true">↗</span></Link>
    </main>
  )
}
