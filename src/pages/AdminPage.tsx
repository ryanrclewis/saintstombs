import { useCallback, useEffect, useState } from 'react'
import { StructuredEditor } from '../components/StructuredEditor/StructuredEditor'
import './AdminPage.css'

interface RegionFile {
  name: string
  path: string
}

interface GhUser {
  login: string
  name: string
  avatar_url: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function AdminPage() {
  const [user, setUser] = useState<GhUser | null | undefined>(undefined) // undefined = loading
  const [files, setFiles] = useState<RegionFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [fileSha, setFileSha] = useState<string | null>(null)
  const [commitMessage, setCommitMessage] = useState('')
  const [loadingFile, setLoadingFile] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [saveUrl, setSaveUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')


  const isDirty = content !== originalContent

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((d: { user: GhUser | null }) => setUser(d.user))
      .catch(() => setUser(null))
  }, [])

  // Load file list once authenticated
  useEffect(() => {
    if (!user) return
    fetch('/api/admin/regions')
      .then((r) => r.json())
      .then(setFiles)
      .catch(console.error)
  }, [user])

  const openFile = useCallback(async (fileName: string) => {
    if (isDirty && !confirm('You have unsaved changes. Discard them?')) return
    setLoadingFile(true)
    setSaveStatus('idle')
    setSaveUrl(null)
    try {
      const res = await fetch(`/api/admin/regions/${encodeURIComponent(fileName)}`)
      const data = await res.json()
      setSelectedFile(fileName)
      setContent(data.content)
      setOriginalContent(data.content)
      setFileSha(data.sha ?? null)
      setCommitMessage('')
    } finally {
      setLoadingFile(false)
    }
  }, [isDirty])

  const saveFile = useCallback(async () => {
    if (!selectedFile || !fileSha) return
    setSaveStatus('saving')
    setSaveMessage('')
    setSaveUrl(null)
    try {
      const res = await fetch(`/api/admin/regions/${encodeURIComponent(selectedFile)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sha: fileSha, message: commitMessage || undefined }),
      })
      const data = await res.json()
      if (data.ok) {
        setOriginalContent(content)
        setFileSha(null) // will need to re-fetch sha for next save
        setSaveStatus('saved')
        setSaveMessage(`Committed by ${user?.login}`)
        setSaveUrl(data.url ?? null)
        setCommitMessage('')
      } else {
        setSaveStatus('error')
        setSaveMessage(data.error ?? 'Unknown error')
      }
    } catch (err) {
      setSaveStatus('error')
      setSaveMessage(String(err))
    }
  }, [selectedFile, fileSha, content, commitMessage, user])

  // After a successful save, re-fetch sha so the file can be saved again without re-opening
  useEffect(() => {
    if (saveStatus !== 'saved' || !selectedFile || fileSha) return
    fetch(`/api/admin/regions/${encodeURIComponent(selectedFile)}`)
      .then((r) => r.json())
      .then((d) => setFileSha(d.sha ?? null))
      .catch(console.error)
  }, [saveStatus, selectedFile, fileSha])

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const t = setTimeout(() => setSaveStatus('idle'), 5000)
    return () => clearTimeout(t)
  }, [saveStatus])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty && saveStatus !== 'saving') saveFile()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isDirty, saveStatus, saveFile])

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const lineCount = content.split('\n').length
  const entryCount = (content.match(/^\s+-\s+(St\.|Saint|Bl\.|Blessed|Venerable|Servant of God)/gim) ?? []).length

  // ── Loading auth state ──────────────────────────────────
  if (user === undefined) {
    return <div className="admin-auth-screen"><p>Loading…</p></div>
  }

  // ── Not authenticated ───────────────────────────────────
  if (user === null) {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const reason = params.get('reason')
    const errorMessages: Record<string, string> = {
      no_code: 'GitHub did not return an authorization code.',
      auth_failed: `Could not exchange code for a GitHub token.${reason ? ` (${decodeURIComponent(reason)})` : ''}`,
      no_repo_access: 'Your GitHub account cannot access this repository.',
      no_push_access: 'Your GitHub account does not have push access to this repository.',
    }
    return (
      <div className="admin-auth-screen">
        <div className="admin-auth-card">
          <h1>Admin</h1>
          <p>Sign in with GitHub to edit and commit region files.</p>
          {error && (
            <p className="admin-auth-error">{errorMessages[error] ?? `Auth error: ${error}`}</p>
          )}
          <a href="/api/admin/auth/login" className="admin-github-btn">
            <svg viewBox="0 0 16 16" aria-hidden="true" width="20" height="20" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
                2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
                0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82
                .64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82
                .44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65
                3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38
                A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign in with GitHub
          </a>
        </div>
      </div>
    )
  }

  // ── Authenticated ───────────────────────────────────────
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-user">
            <img src={user.avatar_url} alt={user.login} className="admin-avatar" />
            <span className="admin-username">{user.name || user.login}</span>
            <form action="/api/admin/auth/logout" method="post" style={{ marginLeft: 'auto' }}>
              <button type="submit" className="admin-logout-btn" title="Sign out">↩</button>
            </form>
          </div>
          <input
            className="admin-search"
            type="search"
            placeholder="Filter files…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ul className="admin-file-list">
          {filteredFiles.map((f) => (
            <li key={f.name}>
              <button
                className={`admin-file-btn${selectedFile === f.name ? ' active' : ''}${selectedFile === f.name && isDirty ? ' dirty' : ''}`}
                onClick={() => openFile(f.name)}
              >
                <span className="admin-file-name">{f.name.replace('.md', '')}</span>
                {selectedFile === f.name && isDirty && (
                  <span className="admin-dirty-dot" title="Unsaved changes" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="admin-editor-pane">
        {!selectedFile && (
          <div className="admin-empty-state">
            <p>Select a region file to edit</p>
          </div>
        )}

        {selectedFile && (
          <>
            <div className="admin-editor-header">
              <div className="admin-editor-meta">
                <span className="admin-editor-filename">{selectedFile}</span>
                <span className="admin-editor-stats">
                  {lineCount.toLocaleString()} lines · ~{entryCount.toLocaleString()} entries
                </span>
              </div>
              <div className="admin-editor-actions">
                <input
                  className="admin-commit-msg"
                  type="text"
                  placeholder="Commit message (optional)"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  disabled={saveStatus === 'saving'}
                />
                {saveStatus === 'saved' && (
                  <span className="admin-save-msg admin-save-msg--ok">
                    {saveMessage}
                    {saveUrl && (
                      <a href={saveUrl} target="_blank" rel="noreferrer" className="admin-commit-link">
                        View commit ↗
                      </a>
                    )}
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="admin-save-msg admin-save-msg--err">{saveMessage}</span>
                )}
                <button
                  className="admin-btn admin-btn--primary"
                  onClick={saveFile}
                  disabled={!isDirty || saveStatus === 'saving' || !fileSha}
                >
                  {saveStatus === 'saving' ? 'Committing…' : 'Commit'}
                </button>
              </div>
            </div>

            {loadingFile ? (
              <div className="admin-loading">Loading…</div>
            ) : (
              <StructuredEditor
                markdown={content}
                onChange={(md) => {
                  setContent(md)
                  setSaveStatus('idle')
                }}
                filename={selectedFile}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
