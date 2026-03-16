import { useMemo } from 'react'
import { marked } from 'marked'

import donateMarkdown from '../../content/saints/regions/donate.md?raw'

const PAYPAL_DONATION_URL = 'https://www.paypal.com/paypalme/CatholicSaintsGuy'

export function DonatePage() {
  const donateHtml = useMemo(() => marked.parse(donateMarkdown), [])

  return (
    <section className="content-page">
      {/* <p className="eyebrow">Support</p> */}
      <h1>Donate</h1>
      <p>🙏</p>
      <div dangerouslySetInnerHTML={{ __html: donateHtml }} />
      <a
        className="donate-button"
        href={PAYPAL_DONATION_URL}
        target="_blank"
        rel="noreferrer"
      >
        Donate with PayPal
      </a>
    </section>
  )
}
