import { Link } from 'react-router-dom'

const teamMembers = [
  {
    name: 'Swet Patel',
    role: 'Frontend Engineer',
    bio: 'Crafts fluid user interfaces, responsive design systems, spatial WebGL globe visuals, and rich interactive web experiences.',
    avatar: 'SP',
    skills: ['React 19', 'Three.js / WebGL', 'Framer Motion', 'Design Systems'],
    dreamDestination: 'Kyoto, Japan',
  },
  {
    name: 'Nisarg Parmar',
    role: 'Frontend Engineer',
    bio: 'Engineers client-side state architecture, 2D topological route map overlays, and seamless component animations.',
    avatar: 'NP',
    skills: ['React 19', 'Leaflet / Maps', 'CSS Architecture', 'UI/UX Design'],
    dreamDestination: 'Tokyo, Japan',
  },
  {
    name: 'Parekh Manav',
    role: 'Backend Engineer',
    bio: 'Architect of server-side business logic, robust session authentication, rate-limiting, and high-performance microservices.',
    avatar: 'PM',
    skills: ['Node.js', 'Express 5', 'JWT Auth', 'Server Architecture', 'Security'],
    dreamDestination: 'Interlaken, Switzerland',
  },
  {
    name: 'Shrey Patel',
    role: 'Backend & API Engineer',
    bio: 'Develops robust RESTful APIs, multi-modal travel search integrations, and real-time algorithmic curation pipelines.',
    avatar: 'SP',
    skills: ['Node.js', 'Express 5', 'REST APIs', 'Amadeus Travel API', 'System Integration'],
    dreamDestination: 'Santorini, Greece',
  },
  {
    name: 'Aum Parmar',
    role: 'Database Engineer',
    bio: 'Designs relational schemas, geospatial data indexing, cache strategies, and optimized queries for 70+ destinations.',
    avatar: 'AP',
    skills: ['MongoDB 8', 'Mongoose ODM', 'Geospatial Indexing', 'Data Modeling', 'Aggregation'],
    dreamDestination: 'Banff, Canada',
  },
]

const techStack = [
  { category: 'Client & UI', items: ['React 19', 'Vite 8', 'Three.js & React Three Fiber', 'GSAP & Lenis Smooth Scroll', 'Framer Motion'] },
  { category: 'Backend & Data', items: ['Express 5.3', 'Node.js 24', 'Mongoose 9', 'MongoDB 8.2', 'JWT Authentication with HttpOnly Cookies'] },
  { category: 'APIs & Services', items: ['Amadeus Flight Shopping', 'OpenWeatherMap & Open-Meteo', 'Photon Geocoding', 'Razorpay Payments', 'Web Audio Synth'] },
  { category: 'Reliability & Safety', items: ['Express Rate Limiter', 'Helmet Security Headers', 'MongoDB Injection Sanitization', 'Progressive Hardware Degradation'] },
]

export default function DevTeam() {
  return (
    <main
      className="dev-team-page"
      style={{
        padding: 'clamp(64px, 8vw, 104px) clamp(1.25rem, 3vw, 2.5rem) 100px',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 80px)',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header className="dev-team-heading" style={{ textAlign: 'center', marginBottom: 'clamp(5.5rem, 8vw, 8rem)' }}>
          <p className="eyebrow dark" style={{ marginBottom: '1.25rem', letterSpacing: '0.14em' }}>THE ARCHITECTS OF MODERN TRAVEL</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.25rem, 4.5vw, 3.5rem)', margin: '0.5rem 0 1.25rem', letterSpacing: '-0.02em' }}>
            Crafted for the Modern Explorer.
          </h1>
          <p style={{ maxWidth: '680px', margin: '0 auto', fontSize: '1.15rem', color: 'var(--text-muted, #555)', lineHeight: 1.7 }}>
            Odyssey Travel merges thoughtful editorial design, spatial WebGL visuals, and intelligent algorithmic curation to turn wanderlust into seamless itineraries.
          </p>
        </header>

      {/* Team Profiles Section */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginBottom: '1.75rem', textAlign: 'center' }}>
          Core Creators
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {teamMembers.map((member) => (
            <article
              key={member.name}
              style={{
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--border, #e5ded3)',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'var(--navy, #10232d)',
                      color: 'var(--gold, #b58b4a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      letterSpacing: '1px',
                    }}
                  >
                    {member.avatar}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
                      {member.name}
                    </h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gold, #b58b4a)', fontWeight: 600 }}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted, #555)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {member.bio}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: '0.3rem 0.75rem',
                        background: 'var(--bg-muted, #f4efe6)',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--gold, #b58b4a)',
                        border: '1px solid var(--border, transparent)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border, #eee)',
                  paddingTop: '0.85rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted, #777)',
                }}
              >
                📍 Dream Destination: <strong style={{ color: 'var(--text, inherit)' }}>{member.dreamDestination}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Technology Architecture Section */}
      <section
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e5ded3)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.03)',
          marginBottom: '4rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p className="eyebrow dark">FULL-STACK ARCHITECTURE</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', margin: '0.5rem 0' }}>
            Built With Modern Engineering
          </h2>
          <p style={{ color: 'var(--text-muted, #666)', maxWidth: '580px', margin: '0 auto' }}>
            An intentional, dependency-conscious stack engineered for fast loading, graceful fallbacks, and resilient security.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          {techStack.map((col) => (
            <div key={col.category}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--gold, #b58b4a)', borderBottom: '2px solid var(--border, #eee)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                {col.category}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.6rem' }}>
                {col.items.map((tech) => (
                  <li key={tech} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text, inherit)' }}>
                    <span style={{ color: '#4caf50' }}>✓</span>
                    <span>{tech}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / CTA Links */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.25rem', alignItems: 'center' }}>
        <Link
          to="/destinations"
          style={{
            padding: '0.85rem 1.75rem',
            borderRadius: '999px',
            background: 'var(--navy, #10232d)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Explore 50+ Destinations ↗
        </Link>
        <Link
          to="/status"
          style={{
            padding: '0.85rem 1.75rem',
            borderRadius: '999px',
            border: '1px solid var(--border, #d8d0c4)',
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Check System Diagnostics ⚙
        </Link>
      </div>
      </div>
    </main>
  )
}
