import { useMemo } from 'react'
import { marked } from 'marked'

import aboutMarkdown from '../../content/saints/regions/about.md?raw'

export function AboutPage() {
  const aboutHtml = useMemo(() => marked.parse(aboutMarkdown), [])

  return (
    <section className="content-page">
      {/* <p className="eyebrow">About</p> */}
      <h1>About</h1>
      <div dangerouslySetInnerHTML={{ __html: aboutHtml }} />
    </section>
  )
}
