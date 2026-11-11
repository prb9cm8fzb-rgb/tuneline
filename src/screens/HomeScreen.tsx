import PrimaryButton from '../components/PrimaryButton'

export default function HomeScreen({ canContinue, onStart, onContinue }: {
  canContinue: boolean
  onStart: () => void
  onContinue: () => void
}) {
  return (
    <>
      <main className="home-screen">
        <section className="home-copy">
          <p className="eyebrow"><span className="live-dot" /> THE MUSIC TIMELINE GAME</p>
          <h1>Hear it.<br /><span>Name it.</span><br />Place it.</h1>
          <p className="home-description">A little music knowledge. A lot of good memories. Take turns guessing the song, then put every track in its place in time.</p>
          <div className="home-actions">
            <PrimaryButton onClick={onStart}>START A NEW GAME <span>↗</span></PrimaryButton>
            {canContinue && <PrimaryButton variant="secondary" onClick={onContinue}>CONTINUE GAME <span>↗</span></PrimaryButton>}
          </div>
          <p className="micro-note"><span className="lock-icon">▣</span> Saved on this device · No account needed</p>
        </section>
        <section className="hero-art" aria-label="TuneLine music timeline illustration">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <div className="hero-disc"><div className="disc-grooves"><span>♫</span></div></div>
          <div className="hero-note note-a">♪</div><div className="hero-note note-b">♫</div>
          <div className="hero-label label-old">1984 <i /> 1999 <i /> 2024</div>
          <div className="floating-card card-left"><span className="mini-cover">♫</span><span><b>Track #04</b><small>ready to play</small></span><i className="sound-bars"><b /><b /><b /><b /></i></div>
          <div className="floating-card card-right"><span className="card-check">✓</span><span><b>Nice one!</b><small>2 points earned</small></span></div>
          <div className="hero-label label-play">PLAY IT. PLACE IT.</div>
        </section>
        <div className="home-foot"><span>01 — LISTEN</span><i /><span>02 — NAME</span><i /><span>03 — PLACE</span><i /><span>04 — CELEBRATE</span></div>
      </main>
      <footer className="site-footer"><span>© TUNELINE — A GAME FOR GOOD TUNES</span><span>MADE FOR THE MOMENTS BETWEEN THE SONGS <i>✳</i></span></footer>
    </>
  )
}
