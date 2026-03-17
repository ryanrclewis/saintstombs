export function ContactPage() {
  return (
    <section className="content-page">
      {/* <p className="eyebrow">Get In Touch</p> */}
      <h1>Contact</h1>
      <p>
        For research corrections, new saint locations, or general inquiries, please feel free to reach out!
      </p>
      <form
        className="contact-form"
        action="https://formspree.io/f/mykkyvqz"
        method="POST"
      >
        <div className="form-field">
          <label htmlFor="email">
            Your email <span aria-hidden="true">*</span>
            <span className="sr-only">required</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-required="true"
          />
        </div>
        <div className="form-field">
          <label htmlFor="message">
            Your message <span aria-hidden="true">*</span>
            <span className="sr-only">required</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            placeholder="How can we help?"
            aria-required="true"
          />
        </div>

        <button type="submit" className="contact-submit">
          Send message
        </button>
      </form>
      {/* <p className="form-note">
        Messages are sent securely through Formspree.
      </p> */}
    </section>
  )
}
