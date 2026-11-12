import { useEffect, useRef, useState } from 'react'
import PrimaryButton from '../components/PrimaryButton'

const rules = {
  en: {
    title: 'HOW TO PLAY',
    subtitle: 'Six quick steps to TuneLine.',
    languageLabel: 'LANGUAGE',
    steps: [
      ['Listen', 'Teams take turns listening to a music fragment.'],
      ['Guess', 'Enter the artist, song title, and release year, then lock your answers.'],
      ['Reveal', 'Compare with the official answers. Your team marks Artist and Title correct or incorrect; TuneLine checks the year using your chosen tolerance.'],
      ['Score', 'Earn 1 point each for Artist, Title, and Year. A correct year also earns a timeline card and 1 bonus point — up to 4 points per song.'],
      ['Grow the timeline', 'TuneLine places earned cards in order by the song’s actual release year. Then the next team takes a turn.'],
      ['Win', 'After all songs, the team with the highest total wins: regular points plus timeline bonuses.'],
    ],
  },
  nl: {
    title: 'SPELREGELS',
    subtitle: 'TuneLine in zes korte stappen.',
    languageLabel: 'TAAL',
    steps: [
      ['Luister', 'De teams luisteren om de beurt naar een muziekfragment.'],
      ['Raad', 'Vul artiest, songtitel en releasejaar in en vergrendel je antwoorden.'],
      ['Onthul', 'Vergelijk met de officiële antwoorden. Je team markeert artiest en titel als goed of fout; TuneLine controleert het jaar met de gekozen marge.'],
      ['Scoor', 'Verdien 1 punt voor artiest, titel en jaar. Een goed jaar levert ook een tijdlijnkaart en 1 bonuspunt op — maximaal 4 punten per nummer.'],
      ['Bouw de tijdlijn', 'TuneLine plaatst verdiende kaarten op volgorde van het echte releasejaar. Daarna is het volgende team aan de beurt.'],
      ['Win', 'Na alle nummers wint het team met de meeste punten: reguliere punten plus tijdlijnbonussen.'],
    ],
  },
  es: {
    title: 'REGLAS DEL JUEGO',
    subtitle: 'TuneLine en seis pasos.',
    languageLabel: 'IDIOMA',
    steps: [
      ['Escucha', 'Los equipos escuchan por turnos un fragmento musical.'],
      ['Adivina', 'Escribe el artista, el título y el año de lanzamiento; después, bloquea tus respuestas.'],
      ['Revela', 'Compara con las respuestas oficiales. Tu equipo marca Artista y Título como correctos o incorrectos; TuneLine comprueba el año según el margen elegido.'],
      ['Puntúa', 'Consigue 1 punto por Artista, Título y Año. Si aciertas el año, también ganas una tarjeta para la línea del tiempo y 1 punto extra: hasta 4 por canción.'],
      ['Completa la línea del tiempo', 'TuneLine coloca las tarjetas por el año real de lanzamiento. Después juega el siguiente equipo.'],
      ['Gana', 'Al terminar todas las canciones, gana el equipo con más puntos: puntos normales más bonus de la línea del tiempo.'],
    ],
  },
  de: {
    title: 'SPIELREGELN',
    subtitle: 'TuneLine in sechs kurzen Schritten.',
    languageLabel: 'SPRACHE',
    steps: [
      ['Zuhören', 'Die Teams hören sich reihum einen Musikausschnitt an.'],
      ['Raten', 'Gebt Interpret, Songtitel und Erscheinungsjahr ein und sperrt eure Antworten.'],
      ['Auflösen', 'Vergleicht mit den offiziellen Antworten. Euer Team markiert Interpret und Titel als richtig oder falsch; TuneLine prüft das Jahr mit der gewählten Toleranz.'],
      ['Punkte sammeln', 'Für Interpret, Titel und Jahr gibt es jeweils 1 Punkt. Ein richtiges Jahr bringt zusätzlich eine Zeitachsenkarte und 1 Bonuspunkt — höchstens 4 Punkte pro Song.'],
      ['Zeitachse erweitern', 'TuneLine ordnet die Karten nach dem tatsächlichen Erscheinungsjahr ein. Danach ist das nächste Team an der Reihe.'],
      ['Gewinnen', 'Nach allen Songs gewinnt das Team mit den meisten Punkten: reguläre Punkte plus Zeitachsen-Bonus.'],
    ],
  },
  fr: {
    title: 'RÈGLES DU JEU',
    subtitle: 'TuneLine en six étapes.',
    languageLabel: 'LANGUE',
    steps: [
      ['Écouter', 'Les équipes écoutent à tour de rôle un extrait musical.'],
      ['Deviner', 'Saisissez l’artiste, le titre et l’année de sortie, puis verrouillez vos réponses.'],
      ['Révéler', 'Comparez avec les réponses officielles. Votre équipe indique si l’artiste et le titre sont corrects ; TuneLine vérifie l’année selon la marge choisie.'],
      ['Marquer des points', 'Gagnez 1 point pour l’artiste, le titre et l’année. Une année correcte rapporte aussi une carte de frise chronologique et 1 point bonus — jusqu’à 4 points par chanson.'],
      ['Compléter la frise', 'TuneLine place les cartes selon l’année de sortie réelle. Puis, c’est au tour de l’équipe suivante.'],
      ['Gagner', 'À la fin des chansons, l’équipe avec le plus de points gagne : points classiques plus bonus de frise.'],
    ],
  },
} as const

type RulesLanguage = keyof typeof rules

export default function HomeScreen({ canContinue, onStart, onContinue }: {
  canContinue: boolean
  onStart: () => void
  onContinue: () => void
}) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [language, setLanguage] = useState<RulesLanguage>('en')
  const rulesButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const rulesDialogRef = useRef<HTMLElement>(null)
  const wasRulesOpen = useRef(false)
  const selectedRules = rules[language]

  useEffect(() => {
    if (!rulesOpen) {
      if (wasRulesOpen.current) rulesButtonRef.current?.focus()
      wasRulesOpen.current = false
      return
    }
    wasRulesOpen.current = true
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRulesOpen(false)
      if (event.key === 'Tab') {
        const focusable = rulesDialogRef.current?.querySelectorAll<HTMLElement>('button, select')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rulesOpen])

  return (
    <>
      <main className="home-screen">
        <section className="home-copy">
          <p className="eyebrow"><span className="live-dot" /> THE MUSIC TIMELINE GAME</p>
          <h1>Hear it.<br /><span>Name it.</span><br />Place it.</h1>
          <p className="home-description">A little music knowledge. A lot of good memories. Take turns naming each track; TuneLine checks your answers and grows a shared timeline.</p>
          <div className="home-actions">
            <PrimaryButton onClick={onStart}>START A NEW GAME <span>↗</span></PrimaryButton>
            {canContinue && <PrimaryButton variant="secondary" onClick={onContinue}>CONTINUE GAME <span>↗</span></PrimaryButton>}
            <button
              ref={rulesButtonRef}
              className="button button-quiet rules-open-button"
              onClick={() => setRulesOpen(true)}
            >
              GAME RULES
            </button>
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
      {rulesOpen && (
        <div className="rules-overlay" onClick={() => setRulesOpen(false)}>
          <section
            ref={rulesDialogRef}
            className="rules-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rules-dialog-header">
              <div>
                <p className="eyebrow">TUNELINE</p>
                <h2 id="rules-title">{selectedRules.title}</h2>
                <p className="rules-subtitle">{selectedRules.subtitle}</p>
              </div>
              <button
                ref={closeButtonRef}
                className="rules-close"
                onClick={() => setRulesOpen(false)}
                aria-label="Close game rules"
              >
                ×
              </button>
            </div>
            <label className="rules-language">
              <span>{selectedRules.languageLabel}</span>
              <select value={language} onChange={(event) => {
                const value = event.currentTarget.value
                if (value === 'en' || value === 'nl' || value === 'es' || value === 'de' || value === 'fr') setLanguage(value)
              }}>
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </label>
            <ol className="rules-steps">
              {selectedRules.steps.map(([heading, description], index) => (
                <li key={heading}>
                  <span className="rules-step-number">{String(index + 1).padStart(2, '0')}</span>
                  <div><h3>{heading}</h3><p>{description}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
      <footer className="site-footer"><span>© TUNELINE — A GAME FOR GOOD TUNES</span><span>MADE FOR THE MOMENTS BETWEEN THE SONGS <i>✳</i></span></footer>
    </>
  )
}
