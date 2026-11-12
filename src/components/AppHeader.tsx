type Props = {
  step?: string
  onHome?: () => void
  onPause?: () => void
  onAbandon?: () => void
}

export default function AppHeader({ step, onHome, onPause, onAbandon }: Props) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onHome} aria-label="Go to TuneLine home">
        <span className="brand-mark"><span /><span /><span /><span /><span /></span>
        <span className="brand-name">TuneLine</span>
      </button>
      <div className="header-center">HEAR IT <i /> NAME IT <i /> PLACE IT</div>
      <div className="header-right">
        {step && <div className="header-step">{step}</div>}
        {onPause && onAbandon && (
          <div className="header-game-controls">
            <button className="header-game-action" onClick={onPause}>PAUSE</button>
            <button className="header-game-action header-game-abandon" onClick={onAbandon}>ABANDON</button>
          </div>
        )}
        {!step && <div className="header-step"><span className="live-dot">LOCAL PLAY</span></div>}
      </div>
    </header>
  )
}
