import Layout from '../components/Layout';

export default function Donate() {
  return (
    <Layout
      title="SaintsTombs - Donate"
      description="Support the SaintsTombs mission. Your donation helps us document and preserve information about sacred pilgrimage sites worldwide."
      ogUrl="https://saintstombs.com/donate"
      activePage="donate"
    >
      <main className="explorer-container" id="main-content">
        <header className="explorer-header">
          <h1 className="text-gradient">Support the Mission</h1>
        </header>

        <section className="contact-section glass">
          <div className="contact-card">
            <div className="contact-icon" aria-hidden="true">🙏</div>
            <h2>Make a Donation</h2>
            <p>If you see fit, please contribute financially to this ongoing effort. It helps.</p>
            <a
              href="https://www.paypal.com/paypalme/CatholicSaintsGuy"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-button"
              aria-label="Donate via PayPal (opens in new window)"
            >
              Donate via PayPal
            </a>
            <p className="contact-note">You will be redirected to PayPal&apos;s secure site.</p>
          </div>
        </section>
      </main>
      <div className="background-overlay"></div>
    </Layout>
  );
}
