type Props = { step?: string; onHome?: () => void }

export default function AppHeader({ step, onHome }: Props) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onHome} aria-label="Go to TuneLine home">
        <span className="brand-mark"><span /><span /><span /><span /><span /></span>
        <span className="brand-name">TuneLine</span>
      </button>
      <div className="header-center">HEAR IT <i /> NAME IT <i /> PLACE IT</div>
      <div className="header-step">{step ?? <span className="live-dot">LOCAL PLAY</span>}</div>
    </header>
  )
}
