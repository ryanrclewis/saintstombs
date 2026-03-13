import Layout from '../components/Layout';

export default function Contact() {
  return (
    <Layout
      title="SaintsTombs - Contact"
      description="Get in touch with the SaintsTombs team. Contact us to share information about saints' resting places or learn more about our mission."
      ogUrl="https://saintstombs.com/contact"
      activePage="contact"
    >
      <main className="explorer-container" id="main-content">
        <header className="explorer-header">
          <h1 className="text-gradient">Get in Touch</h1>
          <p>Have a question or a discovery to share? We&apos;d love to hear from you.</p>
        </header>

        <section className="contact-section glass">
          <div className="contact-card">
            <div className="contact-icon" aria-hidden="true">✉️</div>
            <h2>Email Us</h2>
            <p>For research corrections, new saint locations, or general inquiries, please feel free to reach out!</p>
            <form className="contact-form" action="https://formspree.io/f/mykkyvqz" method="POST">
              <div className="form-field">
                <label htmlFor="email">Your email <span aria-label="required">*</span></label>
                <input type="email" id="email" name="email" required placeholder="you@example.com" aria-required="true" />
              </div>
              <div className="form-field">
                <label htmlFor="message">Your message <span aria-label="required">*</span></label>
                <textarea id="message" name="message" rows={4} required placeholder="How can we help?" aria-required="true"></textarea>
              </div>
              <button type="submit" className="contact-submit">Send message</button>
            </form>
          </div>
        </section>
      </main>
      <div className="background-overlay"></div>
    </Layout>
  );
}
