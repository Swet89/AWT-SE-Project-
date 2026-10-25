import { Link } from 'react-router-dom'

export default function Contact() {
  const email = 'Manthan@example.com'
  const phone = '+91 9724282267'

  return (
    <main className="contact-page">
      <section className="contact-card">
        <p className="eyebrow">WE’RE HERE TO HELP</p>
        <h1>Contact us</h1>
        <p>
          Have a question about your journey? Get in touch and we’ll be happy
          to help.
        </p>

        <div className="contact-details">
          <div>
            <h2>Email</h2>
            <a href={`mailto:${email}`}>{email}</a>
          </div>

          <div>
            <h2>Phone</h2>
            <a href={`tel:${phone.replaceAll(' ', '')}`}>{phone}</a>
          </div>
        </div>

        <Link to="/">Return home</Link>
      </section>
    </main>
  )
}