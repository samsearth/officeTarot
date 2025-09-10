import React, { useEffect, useMemo, useRef, useState } from "react";
// Usage counter (local preview only)
function useVisitCounter() {
  const [count, setCount] = useState<number>(2968);
  useEffect(() => {
    const key = 'officeTarotVisitCount';
    let visits = parseInt(localStorage.getItem(key) || '2967', 10);
    visits = isNaN(visits) ? 2968 : visits + 1;
    localStorage.setItem(key, String(visits));
    setCount(visits);
  }, []);
  return count;
}


// Default hero image filename (will be overridden by upload/URL if provided)
const HERO_IMG = "https://tamx3.wordpress.com/wp-content/uploads/2025/08/5bf59ea4-69ff-4e1a-b1d8-a263d3a77783.webp"; // inlined base64 portrait

/**
 * Your Office Vibe — Office Tarot (single-file React)
 *  - Ambient chime music (top-right 🔔/🔕)
 *  - Tarot-looking answer cards + playful result card
 *  - PNG export (Blob + dataURL fallback)
 *  - No OKLCH colors; wide-compat CSS only
 *  - Tiny runtime tests for scoring + tie-break
 */

// Archetype key type
type ArchetypeKey = 'dreamer' | 'builder' | 'straightShooter' | 'connector';

// Archetypes
const ARCHETYPES: Record<ArchetypeKey, {
  title: string;
  emoji: string;
  vibe: string;
  prophecy: string;
  lucky: string;
  blurb: string;
  strengths: string[];
  watch: string[];
}> = {
  dreamer: {
    title: "The Dreamer",
    emoji: "💭",
    vibe: "Vision on tap, vibes for days",
    prophecy: "Pitch the daring path, then pair it with one concrete next step.",
    lucky: "Blue sticky notes",
    blurb:
      "You’re the spark. Half‑baked ideas become billion‑dollar visions. You make Mondays feel like a startup. Remember: not everything needs three moonshots before lunch.",
    strengths: ["Inspires", "Sees possibilities", "Comfortable in chaos"],
    watch: ["Scope creep", "Tangent storms"],
  },
  builder: {
    title: "The Builder",
    emoji: "🛠️",
    vibe: "Calm checklists, unstoppable shipping",
    prophecy: "Your Gantt chart will set a soul free. Schedule the dry run.",
    lucky: "Extra monitor",
    blurb:
      "You’re the backbone. Color‑coded action items, backup decks, ship dates that actually ship. Beware becoming the ‘what’s the ETA?’ person five minutes into brainstorming.",
    strengths: ["Reliable", "Plans well", "Delivers"],
    watch: ["Process overplay", "Vibe‑killing timelines"],
  },
  straightShooter: {
    title: "The Straight Shooter",
    emoji: "🎯",
    vibe: "No fluff, just facts",
    prophecy: "Cut one meeting in half today. They’ll thank you later.",
    lucky: "Muted mic that actually mutes",
    blurb:
      "You’re the truth serum. One sentence from you can reset a meeting. People respect the clarity—sometimes fear it. Honesty lands best with a side of grace.",
    strengths: ["Clarity", "Risk‑spotting", "Time saver"],
    watch: ["Blunt edges", "Low patience"],
  },
  connector: {
    title: "The Connector",
    emoji: "🔗",
    vibe: "Vibes engineer and morale battery",
    prophecy: "DM two people who should meet. Watch magic happen.",
    lucky: "Team GIF folder",
    blurb:
      "You’re the glue. Memes, laughs, and 5 p.m. brainstorms that somehow feel like happy hour. Teams run better with you—just don’t let vibes outrun deadlines.",
    strengths: ["Morale", "Bridges people", "Energizes"],
    watch: ["Slack on details", "Deadline drift"],
  },
};

// Portrait emoji for result avatar
const FACE: Record<ArchetypeKey, string> = {
  dreamer: "🧙‍♀️",
  builder: "👷",
  straightShooter: "🕵️",
  connector: "🕺",
};

// Suits for whimsical tarot styling per choice index
const SUITS: { name: string; emoji: string }[] = [
  { name: "Cups", emoji: "🍷" },
  { name: "Swords", emoji: "⚔️" },
  { name: "Pentacles", emoji: "🪙" },
  { name: "Wands", emoji: "🪄" },
];


// Question and answer types
type Question = {
  id: number;
  q: string;
  options: { t: string; a: ArchetypeKey }[];
};

const QUESTIONS: Question[] = [
  { id: 1, q: "Margie just scheduled an LT meeting for 7:30 a.m. Friday. You think…", options: [ { t: "Perfect, I’ll stun them with a pre-read.", a: "builder" }, { t: "Cool, another round of buzzword bingo.", a: "straightShooter" }, { t: "Fake bad Wi‑Fi at 7:29?", a: "connector" }, { t: "Finally, my reality show.", a: "dreamer" } ] },
  { id: 2, q: "You’re presenting and PowerPoint dies. What do you do?", options: [ { t: "Channel Satya and wing it.", a: "dreamer" }, { t: "Open the backup deck you emailed yourself at 1 a.m.", a: "builder" }, { t: "Whisper: does anyone else have the file open?", a: "straightShooter" }, { t: "Improv comedy hour.", a: "connector" } ] },
  { id: 3, q: "Jamal tagged you in a Teams thread with 142 messages. You…", options: [ { t: "Read them all and drop a summary.", a: "builder" }, { t: "Search your name; reply only to that.", a: "straightShooter" }, { t: "So… where did we land?", a: "connector" }, { t: "Drop 👀 and move on.", a: "dreamer" } ] },
  { id: 4, q: "Boss says: ‘Quick call?’ You feel…", options: [ { t: "Promotion vibes.", a: "dreamer" }, { t: "What did I break?", a: "builder" }, { t: "This could’ve been an email.", a: "straightShooter" }, { t: "If it’s bad news, I’ll meme it.", a: "connector" } ] },
  { id: 5, q: "Priya’s presenting 48 slides of wall‑of‑text. You…", options: [ { t: "Ask one big‑picture question to sound smart.", a: "dreamer" }, { t: "Turn notes into action items.", a: "builder" }, { t: "Scroll Insta; act interested and nod occasionally.", a: "connector" }, { t: "Flood chat with spicy GIFs.", a: "straightShooter" } ] },
  { id: 6, q: "Kevin invites you to a brainstorm at 5 p.m. Friday. You…", options: [ { t: "Rally with fresh ideas.", a: "dreamer" }, { t: "Let’s async this in the doc.", a: "builder" }, { t: "Sit silently, camera on.", a: "straightShooter" }, { t: "Crack jokes; call it bonding.", a: "connector" } ] },
  { id: 7, q: "SharePoint shows 12 people editing live. Strategy?", options: [ { t: "Type aggressively so it’s clear who’s boss.", a: "dreamer" }, { t: "Leave 27 comments and tag everyone.", a: "builder" }, { t: "Lurk like a doc ninja; swoop in later.", a: "straightShooter" }, { t: "Highlight random text for chaos.", a: "connector" } ] },
  { id: 8, q: "Hannah asks you to join a cross‑org working group. Brain says…", options: [ { t: "Yes, a new audience for my brilliance.", a: "dreamer" }, { t: "Sure—where’s the charter & KPIs?", a: "builder" }, { t: "Absolutely not; I’m drowning.", a: "straightShooter" }, { t: "Is there swag? Or snacks?", a: "connector" } ] },
  { id: 9, q: "LT fires an unprepped question at you. You…", options: [ { t: "Spin a confident word salad.", a: "dreamer" }, { t: "Great Q—follow‑up offline.", a: "builder" }, { t: "Drop brutal honesty that stuns the room.", a: "straightShooter" }, { t: "Stall with a story until time runs out.", a: "connector" } ] },
  { id: 10, q: "You’re presenting to Satya next week. You…", options: [ { t: "Tell everyone you’ve made it.", a: "dreamer" }, { t: "Prep doc + dry runs scheduled.", a: "builder" }, { t: "Panic—but substance wins.", a: "straightShooter" }, { t: "Update LinkedIn headline.", a: "connector" } ] },
];


const initialScores: Record<ArchetypeKey, number> = { dreamer: 0, builder: 0, straightShooter: 0, connector: 0 };

type Answers = Record<number, ArchetypeKey>;

function tally(answers: Answers): Record<ArchetypeKey, number> {
  const scores: Record<ArchetypeKey, number> = { ...initialScores };
  Object.values(answers).forEach((a) => {
    if (a in scores) scores[a as ArchetypeKey] += 1;
  });
  return scores;
}

function resolveWinner(
  scores: Record<ArchetypeKey, number>,
  order: ArchetypeKey[] = ["builder", "straightShooter", "dreamer", "connector"]
): ArchetypeKey {
  const max = Math.max(...Object.values(scores));
  const top = (Object.keys(scores) as ArchetypeKey[]).filter((k) => scores[k] === max);
  for (const k of order) if (top.includes(k)) return k;
  return top[0];
}

// Tiny runtime tests (dev-only)
function __runTests() {
  const s1 = tally({ 1: "builder", 2: "builder", 3: "dreamer" });
  console.assert(s1.builder === 2 && s1.dreamer === 1, "tally counts");
  const w1 = resolveWinner({ dreamer: 1, builder: 2, straightShooter: 0, connector: 0 });
  console.assert(w1 === "builder", "winner highest");
  const w2 = resolveWinner({ dreamer: 2, builder: 2, straightShooter: 0, connector: 0 });
  console.assert(w2 === "builder", "tie-break default");
  const w3 = resolveWinner(
    { dreamer: 2, builder: 2, straightShooter: 0, connector: 0 },
    ["dreamer", "builder", "straightShooter", "connector"]
  );
  console.assert(w3 === "dreamer", "tie-break custom");
  const s0 = tally({});
  console.assert(Object.values(s0).every((v) => v === 0), "empty tally zeros");
  const w4 = resolveWinner({ dreamer: 0, builder: 0, straightShooter: 0, connector: 0 });
  console.assert(["builder","straightShooter","dreamer","connector"].includes(w4), "winner defined even when all zero");
}

export default function App() {
  const visitCount = useVisitCounter();
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>("intro");
  const [index, setIndex] = useState<number>(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  // dlMode removed
  // Download notice state removed

  // OpenAI integration for omen
  // Omen state removed

  // Hero image: fixed to provided clairvoyant portrait
  const heroSrc = HERO_IMG;

  // Ambient chime music (top-right toggle)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [ambienceOn, setAmbienceOn] = useState<boolean>(false);
  const chimeTimers = useRef<number[]>([]);

  const startAmbience = async () => {
    if (audioCtxRef.current) { setAmbienceOn(true); return; }
    const Ctx: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.045; // a bit louder for effect
    master.connect(ctx.destination);

    // Add a mystical reverb (convolver with short impulse)
    const reverb = ctx.createConvolver();
    // Simple impulse response for shimmer
    const impulse = ctx.createBuffer(2, 0.8 * ctx.sampleRate, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = impulse.getChannelData(c);
      for (let i = 0; i < ch.length; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.5) * 0.4;
      }
    }
    reverb.buffer = impulse;
    reverb.connect(master);

    // More mysterious, complex bell
    const playBell = (freq: number) => {
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 3.2);

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = freq * 2; bp.Q.value = 10;
      const delay = ctx.createDelay(); delay.delayTime.value = 0.33 + Math.random() * 0.18;
      const fb = ctx.createGain(); fb.gain.value = 0.28; delay.connect(fb); fb.connect(delay);

      gain.connect(bp); bp.connect(reverb); bp.connect(master); bp.connect(delay); delay.connect(master);

      // Add more partials and shimmer
      const partials = [1.0, 1.19, 1.5, 2.01, 2.5, 2.98, 3.99];
      partials.forEach((ratio, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = freq * ratio;
        o.detune.value = (Math.random() - 0.5) * 18;
        o.connect(gain);
        o.start(now + i * 0.01);
        o.stop(now + 2.7 + Math.random() * 0.7);
      });
      // Add a mystical arpeggio effect sometimes
      if (Math.random() < 0.33) {
        for (let j = 0; j < 4; j++) {
          const o = ctx.createOscillator();
          o.type = "sawtooth";
          o.frequency.value = freq * (1 + 0.07 * j);
          o.detune.value = 120 + Math.random() * 40;
          const g = ctx.createGain();
          g.gain.value = 0.04;
          o.connect(g); g.connect(reverb);
          o.start(now + 0.18 + j * 0.09);
          o.stop(now + 0.32 + j * 0.09);
        }
      }
    };

    // Use a minor scale and tritones for mystery
    const scale = [261.63, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25, 622.25]; // C minor + tritone
    const schedule = () => {
      const delayMs = 1800 + Math.random() * 1800;
      const id = window.setTimeout(() => {
        const f = scale[Math.floor(Math.random() * scale.length)];
        playBell(f);
        schedule();
      }, delayMs);
      chimeTimers.current.push(id);
    };

    // Mystical pad: more intervals, shimmer, and slow LFO
    const padGain = ctx.createGain();
    padGain.gain.value = 0.022;
    padGain.connect(reverb);

    const playPad = (base: number) => {
      const now = ctx.currentTime;
      const rel = [1.0, 1.19, 1.5, 1.81]; // minor, tritone, fifth, minor 7th
      rel.forEach((r: number, idx: number) => {
        const o = ctx.createOscillator();
        o.type = idx % 2 === 0 ? 'sine' : 'triangle';
        o.frequency.value = (base * r) / 2;
        // Add slow LFO for shimmer
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.13 + Math.random() * 0.09;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 8 + Math.random() * 8;
        lfo.connect(lfoGain); lfoGain.connect(o.detune);
        lfo.start(now); lfo.stop(now + 10.0);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.11, now + 1.4 + idx * 0.25);
        g.gain.exponentialRampToValueAtTime(0.00001, now + 10.0);
        o.connect(g); g.connect(padGain);
        o.start(now); o.stop(now + 10.0);
      });
    };

    const padNotes = [174.61, 220.00, 246.94, 261.63, 311.13]; // F3, A3, B3, C4, Eb4
    const padLoop = () => {
      playPad(padNotes[Math.floor(Math.random() * padNotes.length)]);
      const id = window.setTimeout(padLoop, 9000 + Math.random() * 2000);
      chimeTimers.current.push(id);
    };

    // Play first bell and pad immediately for instant feedback
    playBell(scale[Math.floor(Math.random() * scale.length)]);
    playPad(padNotes[Math.floor(Math.random() * padNotes.length)]);
    schedule();
    padLoop();

    audioCtxRef.current = ctx; setAmbienceOn(true);
  };

  const stopAmbience = async () => {
    if (!audioCtxRef.current) return;
    chimeTimers.current.forEach((id) => clearTimeout(id));
    chimeTimers.current = [];
    try { await audioCtxRef.current!.close(); } catch {}
    audioCtxRef.current = null; setAmbienceOn(false);
  };

  useEffect(() => { if (typeof window !== "undefined") {
      try { __runTests(); } catch (e) { console.warn(e); }
    }
  }, []);

  const scores = useMemo(() => tally(answers), [answers]);
  const winner = useMemo(() => resolveWinner(scores), [scores]);
  const current = QUESTIONS[index];
  const picked = current ? answers[current.id] : undefined;
  const progress = `${index + 1}/${QUESTIONS.length}`;

  // Omen effect removed

  const onPick = (qid: number, a: ArchetypeKey) => setAnswers((prev) => ({ ...prev, [qid]: a }));
  const next = () => { if (index < QUESTIONS.length - 1) setIndex((i) => i + 1); else setPhase("result"); };
  const restart = () => { setAnswers({}); setIndex(0); setPhase("intro"); };

  // Download card function removed

  return (
  <div className="site-shell">
      {/* top-right music button */}
      <button className="music-btn" onClick={() => (ambienceOn ? stopAmbience() : startAmbience())} title={ambienceOn ? 'Mute ambience' : 'Play ambience'}>
        {ambienceOn ? (
          <span aria-label="Mute" style={{display:'inline-block',width:'1.7em',height:'1.7em',verticalAlign:'middle'}}>
            <svg viewBox="0 0 32 32" width="1.7em" height="1.7em" style={{display:'block'}}>
              <g filter="url(#shadow)">
                <path d="M8 20V12h6l7-5v18l-7-5H8z" fill="#e11d48" stroke="#fffbe8" strokeWidth="1.5"/>
                <line x1="6" y1="26" x2="26" y2="6" stroke="#fde68a" strokeWidth="2.5" strokeLinecap="round"/>
              </g>
              <defs>
                <filter id="shadow" x="-2" y="-2" width="36" height="36" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#0a0607" flood-opacity=".18"/>
                </filter>
              </defs>
            </svg>
          </span>
        ) : (
          <span aria-label="Music on" style={{display:'inline-block',width:'1.7em',height:'1.7em',verticalAlign:'middle'}}>
            <svg viewBox="0 0 32 32" width="1.7em" height="1.7em" style={{display:'block'}}>
              <g filter="url(#shadow)">
                <path d="M8 20V12h6l7-5v18l-7-5H8z" fill="#f59e0b" stroke="#fffbe8" strokeWidth="1.5"/>
                <path d="M23 12c1.5 1.5 1.5 6 0 7.5" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round"/>
                <path d="M26 9c3 3 3 11 0 14" fill="none" stroke="#fde68a" strokeWidth="2" strokeLinecap="round"/>
              </g>
              <defs>
                <filter id="shadow" x="-2" y="-2" width="36" height="36" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#0a0607" flood-opacity=".18"/>
                </filter>
              </defs>
            </svg>
          </span>
        )}
      </button>

      <div className="container">
        {/* Intro */}
        {phase === "intro" && (
          <div className="intro redesigned-intro">
            <div className="intro-content">
              <div className="seer seer-hero" aria-label="Clairvoyant with glistening eyes">
                <img src={heroSrc} alt="Clairvoyant" className="seer-img" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none';}}/>
              </div>
              <div className="intro-title-block">
                <div className="intro-title">Your Office Vibe</div>
                <p className="intro-blurb">Play the Tarot. 10 quesitons, 1 minute.</p>
              </div>
              <div className="intro-actions">
                <button
                  onClick={() => {
                    setPhase("quiz");
                    startAmbience();
                  }}
                  className="btn btn-primary btn-hero"
                >
                  Begin the reading
                </button>
              </div>
              <div style={{width:'100%',textAlign:'center',marginTop:'12px',marginBottom:'0',position:'relative',zIndex:20}}>
                <button style={{
                  fontSize:'1.18rem',
                  fontWeight:900,
                  color:'#222',
                  background:'#fffbe8',
                  border:'2.5px solid #eab308',
                  borderRadius:'16px',
                  padding:'8px 28px',
                  boxShadow:'0 2px 8px #eab30833',
                  letterSpacing:'.09em',
                  margin:'0 auto',
                  display:'inline-block',
                  opacity:1,
                  cursor:'default',
                  fontFamily:'monospace',
                }}>
                  <span style={{color:'#eab308',fontWeight:900,marginRight:'8px'}}>🎱</span>
                  <span style={{color:'#222',fontWeight:900}}>You are visitor</span>
                  <span style={{color:'#222',fontWeight:900,marginLeft:'8px'}}>{visitCount.toLocaleString()}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz */}
        {phase === "quiz" && current && (
          <div className="quiz">
            <div className="quiz-top">
              <span className="badge">Card {progress}</span>
              <span className="badge-ghost">{Object.keys(answers).length} chosen</span>
            </div>

            <div className="tarot-frame">
              <div className="tarot-card">
                <div className="tarot-card-inner">
                  <div className="tarot-card-face">
                    <div className="question">
                      <h3 className="question-text">{current.q}</h3>
                      <div className="tarot-deck" aria-label="answer deck">
                        {current.options.map((opt, i) => {
                          // Dynamically set z-index: selected card always gets the highest
                          const baseZ = i + 1;
                          const isSelected = picked === opt.a;
                          const zIndex = isSelected ? 99 : baseZ;
                          return (
                            <button
                              key={i}
                              onClick={() => onPick(current.id, opt.a)}
                              className={`mini-tarot${isSelected ? " selected" : ""}`}
                              aria-label={`Choice ${i + 1}`}
                              style={{ zIndex }}
                            >
                              <div className="mini-tarot-face">
                                <div className="glint" aria-hidden />
                                <div className="mini-top-circle">
                                  <span className="mini-roman">{["I", "II", "III", "IV"][i]}</span>
                                </div>
                                <div className="mini-body">{opt.t}</div>
                                <div className="mini-art playful-art">
                                  {(() => {
                                    switch (i) {
                                      case 0: // Cups
                                        return <svg className="tarot-art" viewBox="0 0 32 32" width="36" height="36"><ellipse cx="16" cy="22" rx="10" ry="5" fill="#60a5fa" stroke="#1e293b" strokeWidth="2"/><rect x="8" y="12" width="16" height="10" rx="6" fill="#fef9c3" stroke="#1e293b" strokeWidth="2"/><rect x="12" y="24" width="8" height="6" rx="3" fill="#fbbf24" stroke="#1e293b" strokeWidth="2"/><circle cx="16" cy="28" r="2.2" fill="#fbbf24" stroke="#eab308" strokeWidth="1.2"/><text x="16" y="30.5" textAnchor="middle" fontSize="1.2rem" fill="#e11d48">✨</text></svg>;
                                      case 1: // Swords
                                        return <svg className="tarot-art" viewBox="0 0 32 32" width="36" height="36"><rect x="14" y="10" width="4" height="14" rx="2" fill="#e0e7ef" stroke="#1e293b" strokeWidth="2"/><polygon points="16,4 20,10 12,10" fill="#64748b"/><rect x="13" y="24" width="6" height="4" rx="2" fill="#fbbf24" stroke="#1e293b" strokeWidth="2"/><circle cx="16" cy="28" r="2.2" fill="#fbbf24" stroke="#eab308" strokeWidth="1.2"/><text x="16" y="30.5" textAnchor="middle" fontSize="1.2rem" fill="#e11d48">✦</text></svg>;
                                      case 2: // Pentacles
                                        return <svg className="tarot-art" viewBox="0 0 32 32" width="36" height="36"><circle cx="16" cy="24" r="7" fill="#fde68a" stroke="#b45309" strokeWidth="2"/><polygon points="16,18 19,28 10,21 22,21 13,28" fill="none" stroke="#b45309" strokeWidth="1.5"/><circle cx="16" cy="28" r="2.2" fill="#fbbf24" stroke="#eab308" strokeWidth="1.2"/><text x="16" y="30.5" textAnchor="middle" fontSize="1.2rem" fill="#e11d48">★</text></svg>;
                                      case 3: // Wands
                                        return <svg className="tarot-art" viewBox="0 0 32 32" width="36" height="36"><rect x="14" y="14" width="4" height="10" rx="2" fill="#a16207" stroke="#1e293b" strokeWidth="2"/><ellipse cx="16" cy="14" rx="4" ry="3" fill="#fbbf24" stroke="#1e293b" strokeWidth="2"/><circle cx="16" cy="28" r="2.2" fill="#fbbf24" stroke="#eab308" strokeWidth="1.2"/><text x="16" y="30.5" textAnchor="middle" fontSize="1.2rem" fill="#e11d48">✶</text></svg>;
                                      default:
                                        return null;
                                    }
                                  })()}
                                </div>
                                <div style={{marginTop:'auto',width:'100%',display:'flex',justifyContent:'center'}}>
                                  <span className="mini-flourish" aria-hidden>
                                    {(() => {
                                      switch (i) {
                                        case 0: // Cups
                                          return (
                                            <svg width="120" height="48" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <defs>
                                                <radialGradient id="cupsGold" cx="50%" cy="50%" r="50%">
                                                  <stop offset="0%" stopColor="#fffbe8"/>
                                                  <stop offset="100%" stopColor="#fbbf24"/>
                                                </radialGradient>
                                              </defs>
                                              <path d="M12 36 Q40 8 60 36 Q80 64 108 36" stroke="#eab308" strokeWidth="3.5" fill="none"/>
                                              <ellipse cx="60" cy="36" rx="10" ry="6" fill="url(#cupsGold)" stroke="#60a5fa" strokeWidth="2.2"/>
                                              <circle cx="60" cy="36" r="3.2" fill="#60a5fa" stroke="#eab308" strokeWidth="1.5"/>
                                              <path d="M60 36 Q64 28 72 32" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
                                              <path d="M60 36 Q56 28 48 32" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
                                              <path d="M40 44 Q60 40 80 44" stroke="#eab308" strokeWidth="1.2" fill="none"/>
                                              <text x="60" y="46" textAnchor="middle" fontSize="1.6rem" fill="#e11d48" style={{fontFamily:'serif'}}>✶</text>
                                            </svg>
                                          );
                                        case 1: // Swords
                                          return (
                                            <svg width="120" height="48" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <defs>
                                                <radialGradient id="swordGold" cx="50%" cy="50%" r="50%">
                                                  <stop offset="0%" stopColor="#fffbe8"/>
                                                  <stop offset="100%" stopColor="#fbbf24"/>
                                                </radialGradient>
                                              </defs>
                                              <path d="M12 36 Q40 8 60 36 Q80 64 108 36" stroke="#64748b" strokeWidth="3.5" fill="none"/>
                                              <rect x="54" y="20" width="12" height="18" rx="5" fill="#e0e7ef" stroke="#64748b" strokeWidth="2.2"/>
                                              <polygon points="60,10 70,20 50,20" fill="#64748b"/>
                                              <rect x="57" y="38" width="6" height="6" rx="3" fill="#fbbf24" stroke="#eab308" strokeWidth="1.2"/>
                                              <circle cx="60" cy="36" r="3.2" fill="#64748b" stroke="#eab308" strokeWidth="1.5"/>
                                              <path d="M40 44 Q60 40 80 44" stroke="#64748b" strokeWidth="1.2" fill="none"/>
                                              <text x="60" y="46" textAnchor="middle" fontSize="1.6rem" fill="#e11d48" style={{fontFamily:'serif'}}>✦</text>
                                            </svg>
                                          );
                                        case 2: // Pentacles
                                          return (
                                            <svg width="120" height="48" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <defs>
                                                <radialGradient id="pentGold" cx="50%" cy="50%" r="50%">
                                                  <stop offset="0%" stopColor="#fffbe8"/>
                                                  <stop offset="100%" stopColor="#fbbf24"/>
                                                </radialGradient>
                                              </defs>
                                              <path d="M12 36 Q40 8 60 36 Q80 64 108 36" stroke="#b45309" strokeWidth="3.5" fill="none"/>
                                              <circle cx="60" cy="36" r="10" fill="url(#pentGold)" stroke="#b45309" strokeWidth="2.2"/>
                                              <polygon points="60,26 66,42 52,34 68,34 54,42" fill="none" stroke="#b45309" strokeWidth="1.7"/>
                                              <circle cx="60" cy="36" r="3.2" fill="#b45309" stroke="#eab308" strokeWidth="1.5"/>
                                              <path d="M40 44 Q60 40 80 44" stroke="#b45309" strokeWidth="1.2" fill="none"/>
                                              <text x="60" y="46" textAnchor="middle" fontSize="1.6rem" fill="#e11d48" style={{fontFamily:'serif'}}>★</text>
                                            </svg>
                                          );
                                        case 3: // Wands
                                          return (
                                            <svg width="120" height="48" viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <defs>
                                                <radialGradient id="wandGold" cx="50%" cy="50%" r="50%">
                                                  <stop offset="0%" stopColor="#fffbe8"/>
                                                  <stop offset="100%" stopColor="#fbbf24"/>
                                                </radialGradient>
                                              </defs>
                                              <path d="M12 36 Q40 8 60 36 Q80 64 108 36" stroke="#a16207" strokeWidth="3.5" fill="none"/>
                                              <rect x="54" y="24" width="12" height="14" rx="5" fill="#a16207" stroke="#eab308" strokeWidth="2.2"/>
                                              <ellipse cx="60" cy="24" rx="7" ry="4" fill="url(#wandGold)" stroke="#a16207" strokeWidth="2.2"/>
                                              <circle cx="60" cy="36" r="3.2" fill="#a16207" stroke="#eab308" strokeWidth="1.5"/>
                                              <path d="M40 44 Q60 40 80 44" stroke="#a16207" strokeWidth="1.2" fill="none"/>
                                              <text x="60" y="46" textAnchor="middle" fontSize="1.6rem" fill="#e11d48" style={{fontFamily:'serif'}}>✶</text>
                                            </svg>
                                          );
                                        default:
                                          return null;
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quiz-actions-below">
              <button
                onClick={next}
                disabled={!picked}
                className={`btn btn-next ${picked ? "btn-primary" : "btn-disabled"}`}
                style={{ alignSelf: 'flex-end', marginRight: 0 }}
              >
                {index === QUESTIONS.length - 1 ? "Reveal my card" : "Next card"}
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {phase === "result" && (
          <div className="result">
            <div ref={cardRef} className="result-card">
              <div className="result-inner">
                <div className="result-head">
                  <div className={`portrait portrait-${winner}`}><div className="portrait-emoji">{FACE[winner]}</div></div>
                  <div>
                    <div className="result-eyebrow">Your Office Archetype</div>
                    <h2 className="result-title">{ARCHETYPES[winner].title}</h2>
                    <div className="result-vibe">{ARCHETYPES[winner].vibe}</div>
                  </div>
                </div>
                <p className="result-blurb">{ARCHETYPES[winner].blurb}</p>
                <div className="result-grid">
                  <div>
                    <div className="result-subhead">Strengths</div>
                    <ul className="result-list">
                      {ARCHETYPES[winner].strengths.map((s, i) => (<li key={i}>{s}</li>))}
                    </ul>
                  </div>
                  <div>
                    <div className="result-subhead">Watch‑outs</div>
                    <ul className="result-list">
                      {ARCHETYPES[winner].watch.map((s, i) => (<li key={i}>{s}</li>))}
                    </ul>
                  </div>
                </div>
                {/* Omen section removed as requested */}
                <div className="result-footer">✨ Built with lots of love✨</div>
              </div>
            </div>

            <div className="result-actions result-actions-right">
              <button onClick={restart} className="btn btn-ghost">Read again</button>
            </div>

            <details className="tally-details">
              <summary>How your fate tallied</summary>
              <div className="tally-grid">
                {Object.entries(scores).map(([k, v]) => (
                  <div key={k} className="tally-item">
                    <div className="tally-eyebrow">{ARCHETYPES[k as ArchetypeKey].title}</div>
                    <div className="tally-value">{v}</div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

  {/* Styles (no OKLCH) */}
  {/* ...removed duplicate visitor counter... */}
      <style>{`
        :root { --ink:#0f172a; --ink-2:#334155; --paper:#ffffff; --gold:#f59e0b; --rose:#e11d48; --amber:#f59e0b; --shadow:0 22px 48px rgba(80,20,20,.35), 0 10px 30px rgba(2,6,23,.18); }
        .site-shell { min-height:100vh; color:#f8fafc; background:
          radial-gradient(1200px 600px at 10% -10%, #2a0f14 0%, #16090c 60%, #0a0607 100%),
          radial-gradient(800px 400px at 110% 20%, rgba(244,114,182,0.22) 0%, rgba(15,6,8,0) 70%);
        }
        .container { max-width:1120px; margin:0 auto; padding:40px 16px; position:relative; }
        @media (max-width: 600px) {
          .container { padding: 12px 2vw; }
        }

        /* Music button */
        .music-btn { position:fixed; right:18px; top:16px; z-index:60; background:#ffffff; color:var(--ink); border:1px solid #cbd5e1; width:56px; height:56px; font-size:28px; border-radius:9999px; box-shadow:0 8px 18px rgba(2,6,23,.16); cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .music-btn:hover { background:#fffaf0; }
        .music-btn:hover { background:#fffaf0; }

        /* Buttons */
        .btn { border-radius:16px; padding:10px 20px; font-weight:600; box-shadow:0 10px 24px rgba(2,6,23,.18); border:0; cursor:pointer; transition:transform .15s ease, box-shadow .2s ease, opacity .2s ease; }
        .btn:active { transform:translateY(1px); }
        .btn-primary { color:#fff; background-image:linear-gradient(90deg, #e11d48, #f59e0b); }
        .btn-primary:hover { filter:brightness(1.05); }
        .btn-disabled { color:#fff; background:rgba(100,116,139,.4); cursor:not-allowed; }
        .btn-ghost { background:#fff; color:var(--ink); border:1px solid #cbd5e1; }
        .btn-ghost:hover { background:#f8fafc; }
        .btn-next {
          font-size: 1.15rem;
          padding: 14px 32px;
          letter-spacing: .02em;
          min-width: 160px;
          border-radius: 20px;
          position: relative;
        }
        @media (max-width: 700px) {
          .btn-next {
            font-size: 1rem;
            padding: 12px 8vw;
            min-width: 0;
            width: 100%;
            border-radius: 16px;
          }
        }
        @media (max-width: 480px) {
          .btn-next {
            font-size: 0.95rem;
            padding: 10px 2vw;
            border-radius: 12px;
          }
        }
        @media (max-width: 700px) {
          .question-text {
            font-size: 1.35rem;
            margin-bottom: 16px;
          }
          .btn-next {
            font-size: 1.1rem;
            padding: 16px 10vw;
            min-width: 0;
            width: 100%;
            border-radius: 22px;
          }
        }
        @media (max-width: 480px) {
          .btn-next {
            font-size: 1rem;
            padding: 14px 4vw;
            border-radius: 16px;
          }
        }
        .btn-next:not(.btn-disabled)::after { content:""; position:absolute; inset:-4px; border-radius:22px; box-shadow:0 0 0 6px rgba(245,158,11,.25); animation:pulse-shadow 1.6s ease-in-out infinite; }
  .btn-hero { font-size:2.1rem; padding:32px 64px; border-radius:40px; letter-spacing:.02em; box-shadow:0 20px 56px rgba(234,88,12,.32); }
        @keyframes pulse-shadow { 0%{ box-shadow:0 0 0 0 rgba(245,158,11,.25);} 70%{ box-shadow:0 0 0 10px rgba(245,158,11,.02);} 100%{ box-shadow:0 0 0 0 rgba(245,158,11,.0);} }

        /* Badges */
        .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:9999px; background-image:linear-gradient(90deg,#f59e0b,#e11d48); color:#fff; font-weight:800; letter-spacing:.02em; box-shadow:0 8px 20px rgba(234,88,12,.35); text-shadow:0 1px 0 rgba(0,0,0,.2); }
        .badge::before { content:"🃏"; }
        .badge-ghost { padding:6px 10px; border-radius:9999px; background:rgba(255,255,255,.08); color:#fde68a; border:1px solid rgba(253,230,138,.35); }

        /* Redesigned intro for better above-the-fold experience */
        .redesigned-intro {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: 80vh;
          padding-top: 32px;
        }
        .intro-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          width: 100%;
          max-width: 540px;
        }
        .seer-hero {
          width: 420px;
          max-width: 90vw;
          margin-bottom: 18px;
          box-shadow:0 24px 64px rgba(2,6,23,.45), 0 0 160px 0 #fde68a33 inset;
          background: none;
          border-radius: 0;
          overflow: visible;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .seer-img {
          width: 100%;
          height: auto;
          max-height: 520px;
          object-fit: contain;
          border-radius: 0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        }
        @media (max-width: 600px) {
          .seer-hero { width: 98vw; max-width: 98vw; }
          .seer-img { max-height: 220px; }
        }
        .intro-title-block {
          text-align: center;
          margin-bottom: 8px;
        }
        .intro-eyebrow {
          color: #f8fafc;
          text-transform: uppercase;
          letter-spacing: .28em;
          font-size: 1.1rem;
          margin-bottom: 10px;
          font-weight: 700;
          text-shadow: 0 2px 12px #0a0607, 0 1px 0 #fde68a88;
        }
        .intro-title {
          color: #fff;
          font-weight: 900;
          font-size: 2.8rem;
          margin-bottom: 10px;
          letter-spacing: .01em;
          text-shadow: 0 2px 16px #0a0607, 0 1px 0 #fde68a88;
        }
        .intro-blurb {
          color: #fef9c3;
          font-size: 1.35rem;
          line-height: 1.8rem;
          font-weight: 600;
          max-width: 40ch;
          margin: 10px auto 0;
          text-shadow: 0 2px 12px #0a0607, 0 1px 0 #fde68a88;
        }
        .intro-actions { display:flex; gap:12px; align-items:center; justify-content:center; margin-top: 18px; }
  .btn-hero { font-size:2.1rem; padding:32px 64px; border-radius:40px; letter-spacing:.02em; box-shadow:0 20px 56px rgba(234,88,12,.32); }

        /* Quiz Tarot Cards - Playful, ornate, and vibrant */
        .tarot-deck {
          position: relative;
          height: 390px;
          z-index: 1;
          margin-top: 54px;
        }
        @media (max-width: 900px) {
          .tarot-deck { height: auto; min-height: 0; }
        }
        @media (max-width: 600px) {
          .tarot-deck {
            grid-template-columns: 1fr;
            min-height: 0;
            margin-top: 18px;
            overflow-x: auto;
            padding-bottom: 8px;
          }
        }
        .question {
          position: relative;
          z-index: 10;
          background: transparent;
          margin-bottom: 36px;
        }
        /* Ensure question text is always above the cards */
        @media (max-width: 600px) {
          .tarot-deck { margin-top: 32px; }
          .question { margin-bottom: 24px; }
        }
        .mini-tarot {
          position: absolute;
          width: 24%;
          aspect-ratio: 3 / 5.2;
          min-height: 240px;
          max-height: 360px;
          top: 18px;
          border: 4px double #eab308;
          border-radius: 28px;
          padding: 0;
          background:
            repeating-linear-gradient(135deg, #fef08a 0 8px, #fbbf24 8px 16px, #fef08a 16px 24px),
            radial-gradient(ellipse at 60% 10%, #f472b6 0%, #fbbf24 40%, #fff 100%),
            linear-gradient(180deg, #fffbe8 0%, #f3ead4 100%);
          color: var(--ink);
          box-shadow: 0 10px 40px 0 #eab30855, 0 0 0 8px #fde68a33 inset, 0 0 0 2px #eab308;
          transition: transform .18s, box-shadow .18s, border-color .18s, z-index .1s;
          overflow: hidden;
          filter: drop-shadow(0 0 18px #fbbf2433);
        }
        @media (max-width: 900px) {
          .mini-tarot {
            position: static;
            width: 98%;
            transform: none;
            min-height: 140px;
            max-height: 220px;
            margin-bottom: 0;
          }
        }
        @media (max-width: 600px) {
          .mini-tarot {
            min-height: 100px;
            max-height: 160px;
            font-size: 0.95rem;
          }
        }
        .mini-tarot:before {
          content: "";
          position: absolute;
          inset: 10px;
          border: 2.5px dashed #e11d48;
          border-radius: 20px;
          opacity: .22;
          pointer-events: none;
          box-shadow: 0 0 32px 6px #f59e0b33;
        }
        .mini-tarot:after {
          content: "✶ ✦ ✶";
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 1.5rem;
          opacity: .45;
          color: #eab308;
          text-shadow: 0 0 8px #fde68a, 0 0 2px #f59e0b;
          pointer-events: none;
        }
        .mini-tarot-face:before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .08;
          mix-blend-mode: multiply;
          background:
            repeating-linear-gradient(45deg, rgba(234,88,12,.08) 0 2px, rgba(0,0,0,0) 2px 5px),
            repeating-linear-gradient(135deg, rgba(244,114,182,.06) 0 1px, rgba(0,0,0,0) 1px 4px);
        }
        .mini-tarot:nth-child(1){ left:3%; transform:rotate(-10deg) scale(1.01); z-index:1; }
        .mini-tarot:nth-child(2){ left:27%; transform:rotate(-4deg) scale(1.01);  z-index:2; }
        .mini-tarot:nth-child(3){ left:51%; transform:rotate(4deg) scale(1.01);   z-index:3; }
        .mini-tarot:nth-child(4){ left:75%; transform:rotate(10deg) scale(1.01); z-index:4; }
        .mini-tarot:before {
          content:"";
          position:absolute;
          inset:10px;
          border:2.5px dashed #e11d48;
          border-radius:20px;
          opacity:.22;
          pointer-events:none;
          box-shadow:0 0 32px 6px #f59e0b33;
        }
        .mini-tarot:after  {
          content:"✶ ✦ ✶";
          position:absolute;
          top:10px;
          right:14px;
          font-size:20px;
          opacity:.55;
          color:#f59e0b;
          text-shadow:0 0 8px #fde68a, 0 0 2px #f59e0b;
        }
        .mini-tarot:hover {
          transform:translateY(-22px) scale(1.08) rotate(0deg);
          border-color:#e11d48;
          box-shadow:0 28px 80px #f472b6aa, 0 0 0 8px #e11d48cc inset, 0 0 32px 8px #e11d4844;
          z-index:9;
        }
        .mini-tarot.selected {
          border-color:#f59e0b;
          box-shadow:0 32px 90px #fbbf24cc, 0 0 0 8px #fde68a99 inset, 0 0 32px 8px #fbbf2444;
          z-index:10;
          transform:translateY(-26px) scale(1.12) rotate(0deg);
        }

        .mini-tarot-face {
          position:relative;
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:22px;
          height:100%;
          padding:38px 22px 28px 22px;
          background: linear-gradient(120deg, #fff7ed 0%, #fde68a 100%);
          border-radius:22px;
          box-shadow:0 0 0 3px #fde68a44 inset;
        }
        .mini-crest {
          display: none;
        }
        .mini-art.playful-art {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 100%;
          margin-top: auto;
          margin-bottom: 0;
          min-height: 38px;
        }
        .tarot-art {
          display: block;
          width: 36px;
          height: 36px;
        }
        .mini-tarot-face {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 100%;
        }
        .tarot-art {
          display: block;
          width: 32px;
          height: 32px;
        }
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fffbe8 60%, #fde68a 100%);
          border: 2.5px solid #f59e0b;
          margin: 0 auto 8px auto;
          box-shadow: 0 2px 12px #f59e0b33;
        }
        .mini-roman {
          font-weight: 900;
          font-size: 1.25rem;
          color: #e11d48;
          letter-spacing: .18em;
          text-shadow: 0 1px 0 #fde68a88, 0 0 6px #fffbe8;
        }
        }
        .mini-body {
          text-align: center;
          font-size: clamp(1.1rem, 2.2vw, 1.45rem);
          line-height: 1.5;
          padding: 0 8px;
          color: var(--ink);
          margin-top: 4px;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: ui-serif, Georgia, 'Times New Roman', serif;
          text-shadow: 0 1px 0 #fde68a88, 0 0 6px #fffbe8;
          word-break: break-word;
        }
        .mini-suit {
          font-size:14px;
          letter-spacing:.35em;
          text-transform:uppercase;
          color:#e11d48;
          font-weight:700;
          text-shadow:0 1px 0 #fde68a88;
        }
        .glint {
          position:absolute;
          }
          .question-text {
            font-size: 1.65rem;
            font-weight: 900;
            color: #fffbe8;
            text-shadow: 0 2px 12px #0a0607, 0 1px 0 #fde68a88;
            margin-bottom: 18px;
            line-height: 1.18;
          }
          height:140%;
          transform:rotate(25deg);
          background:linear-gradient(90deg, rgba(255,255,255,0) 45%, rgba(255,255,255,.25) 50%, rgba(255,255,255,0) 55%);
          pointer-events:none;
          opacity:.0;
          transition:opacity .2s, transform .2s;
        }
        .mini-tarot:hover .glint, .mini-tarot.selected .glint {
          opacity:.8;
          transform:rotate(25deg) translateX(16%);
        }

        @media (max-width:900px){
          .tarot-deck{
            height:auto;
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:12px;
            justify-items:center;
          }
          .mini-tarot{
            position:static;
            width:98%;
            transform:none;
            min-height:160px;
            margin-bottom: 0;
          }
        }
        @media (max-width:600px){
          .tarot-deck{
            grid-template-columns:1fr;
          }
          .mini-tarot{
            min-height:120px;
          }
        }

        /* Result card — tarot style */
        .result-card {
          position: relative;
          overflow: hidden;
          border-radius: 36px;
          border: 4px solid #e11d48;
          background:
            linear-gradient(120deg, #f472b6 0%, #fde68a 100%),
            repeating-linear-gradient(135deg, #fffbe8 0 18px, #f5ead7 18px 36px, #fffbe8 36px 54px),
            linear-gradient(180deg, #fffdf6 0%, #f5ead7 100%);
          box-shadow: 0 24px 64px rgba(234, 88, 12, 0.18), 0 2px 24px #e11d48aa;
          animation: result-pop 0.7s cubic-bezier(.7,-0.2,.3,1.4);
        }
        @media (max-width: 600px) {
          .result-card {
            border-radius: 18px;
            padding: 0;
          }
        }
        @keyframes result-pop {
          0% { transform: scale(0.92) rotate(-2deg); opacity: 0; }
          80% { transform: scale(1.04) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .result-card:before {
          content: "";
          position: absolute;
          inset: 18px;
          border: 3px dashed #fbbf24;
          border-radius: 28px;
          opacity: .38;
          pointer-events: none;
          box-shadow: 0 0 48px 12px #fde68a88;
        }
        .result-card:after {
          content: "✨ ✦ ✶ ✦ ✨";
          position: absolute;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          color: #e11d48;
          letter-spacing: .5em;
          font-size: 1.7rem;
          opacity: .55;
          text-shadow: 0 0 12px #fde68a, 0 0 2px #f59e0b;
        }
        .result-inner {
          padding: 48px 54px 38px 54px;
          background: rgba(255, 251, 232, 0.97);
          border-radius: 28px;
          box-shadow: 0 2px 32px #e11d4822 inset;
        }
        .result-head {
          display: flex;
          align-items: flex-start;
          gap: 32px;
          margin-bottom: 18px;
        }
        .result-eyebrow {
          color: #e11d48;
          text-transform: uppercase;
          letter-spacing: .22em;
          font-size: 15px;
          margin: 0 0 8px;
          font-weight: 800;
          text-shadow: 0 1px 0 #fde68a88;
        }
        .result-title {
          color: #e11d48;
          font-size: 2.7rem;
          font-family: 'Playfair Display', ui-serif, Georgia, 'Times New Roman', serif;
          font-weight: 900;
          margin: 0 0 10px;
          letter-spacing: .01em;
          text-shadow: 0 2px 18px #fde68a66, 0 1px 0 #fde68a88;
        }
        .result-vibe {
          color: #f59e0b;
          font-style: italic;
          margin-bottom: 18px;
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: .01em;
        }
        .result-blurb {
          color: #1e293b;
          margin: 22px 0 28px;
          max-width: 65ch;
          font-size: 1.22rem;
          line-height: 1.8;
          font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .result-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          font-size: 1.13rem;
          margin-bottom: 18px;
        }
        .result-subhead {
          color: #e11d48;
          font-weight: 800;
          margin-bottom: 10px;
          font-size: 1.15rem;
          letter-spacing: .01em;
        }
        .result-list {
          margin: 0 0 0 20px;
          padding: 0;
          list-style: disc;
          color: #1e293b;
          font-size: 1.09rem;
          font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
          font-weight: 500;
        }
        .omen {
          margin-top: 22px;
          padding: 20px 22px;
          border-radius: 18px;
          background: linear-gradient(90deg, #fde68a 60%, #f472b6 100%);
          border: 2px solid #e11d48;
          color: #e11d48;
          font-size: 1.18rem;
          font-weight: 700;
          box-shadow: 0 2px 18px #fde68a55;
          text-align: center;
        }
        .omen-head {
          font-weight: 900;
          margin-bottom: 4px;
          color: #f59e0b;
          letter-spacing: .01em;
          font-size: 1.13rem;
        }
        .omen-lucky { opacity: .8; font-weight: 600; }
        .result-footer {
          margin-top: 28px;
          color: #e11d48;
          font-size: 1.09rem;
          text-align: center;
          letter-spacing: .01em;
          opacity: .92;
          font-weight: 700;
          text-shadow: 0 1px 0 #fde68a88;
        }
        .result-actions {
          display: flex;
          gap: 24px;
          justify-content: center;
          margin-top: 32px;
        }
        .result-actions-right {
          justify-content: flex-end;
        }
        .result-actions .btn-primary {
          font-size: 1.18rem;
          padding: 18px 38px;
          border-radius: 24px;
          background-image: linear-gradient(90deg, #e11d48, #f59e0b);
          font-weight: 900;
          letter-spacing: .01em;
          box-shadow: 0 8px 32px #f472b6aa;
        }
        .result-actions .btn-ghost {
          font-size: 1.09rem;
          padding: 16px 28px;
          border-radius: 20px;
          font-weight: 700;
        }
        @media (max-width: 700px) {
          .result-inner { padding: 18px 4vw 18px 4vw; }
          .result-head { gap: 12px; }
          .result-title { font-size: 1.6rem; }
          .result-blurb { font-size: 1.09rem; }
          .result-grid { gap: 12px; font-size: 1.01rem; }
        }
        @media (max-width: 480px) {
          .result-inner { padding: 8px 2vw 8px 2vw; }
          .result-title { font-size: 1.2rem; }
          .result-blurb { font-size: 0.99rem; }
        }
        @media (max-width: 700px) {
          .result-inner { padding: 18px 4vw 18px 4vw; }
          .result-head { gap: 12px; }
          .result-title { font-size: 1.4rem; }
          .result-blurb { font-size: 1rem; }
          .result-grid { gap: 10px; font-size: 0.98rem; }
        }
        @media (max-width: 480px) {
          .result-inner { padding: 8px 2vw 8px 2vw; }
          .result-title { font-size: 1.1rem; }
          .result-blurb { font-size: 0.95rem; }
        }

        /* Portraits */
        .portrait { width:96px; height:96px; border-radius:9999px; border:2px solid var(--ink); box-shadow:0 10px 24px rgba(2,6,23,.15); display:flex; align-items:center; justify-content:center; }
        .portrait-emoji { font-size:44px; }
        .portrait-dreamer { background: radial-gradient(circle at 30% 30%, #f472b6 0%, #a78bfa 60%, #fde68a 100%); }
        .portrait-builder { background: radial-gradient(circle at 30% 30%, #f59e0b 0%, #84cc16 60%, #fde68a 100%); }
        .portrait-straightShooter { background: radial-gradient(circle at 30% 30%, #60a5fa 0%, #34d399 60%, #e5e7eb 100%); }
        .portrait-connector { background: radial-gradient(circle at 30% 30%, #22d3ee 0%, #f472b6 60%, #eab308 100%); }

  /* Download-safe skin removed */

        /* Tarot surface refinements (no fan layout) */
        .mini-tarot{ border:3px solid #1f2937; border-radius:22px; background:
          radial-gradient(1000px 600px at -10% -20%, rgba(250,204,21,.06), rgba(0,0,0,0) 60%),
          linear-gradient(180deg,#fffdf3 0%, #f3ead4 100%);
          box-shadow: 0 18px 40px rgba(2,6,23,.18), 0 0 0 4px rgba(234,88,12,.05);
        }
        .mini-tarot:before{ border:2px dashed #1f2937; border-radius:16px; opacity:.35; }
        .mini-top{ background:#fff7ed; border:2px solid #1f2937; }
        .mini-body{ font-family: ui-serif, Georgia, 'Times New Roman', serif; font-size:1.25rem; line-height:1.85rem; }

        /* Subtle stars behind the deck */
        .tarot-deck:before{ content:""; position:absolute; inset:0; pointer-events:none; opacity:.15; background:
          radial-gradient(#fff 0.5px, transparent 0.6px) 0 0/32px 32px,
          radial-gradient(#fff 0.8px, transparent 0.9px) 12px 18px/42px 42px;
        }
        /* Paper noise */
        .mini-tarot-face:before{ content:""; position:absolute; inset:0; pointer-events:none; opacity:.05; mix-blend-mode:multiply; background:
          repeating-linear-gradient(45deg, rgba(0,0,0,.04) 0 2px, rgba(0,0,0,0) 2px 5px),
          repeating-linear-gradient(135deg, rgba(0,0,0,.02) 0 1px, rgba(0,0,0,0) 1px 4px);
        }
        .mini-tarot:nth-child(2){ left:27%; transform:rotate(-4deg); }
        .mini-tarot:nth-child(3){ left:51%; transform:rotate(4deg); }
        .mini-tarot:nth-child(4){ left:75%; transform:rotate(14deg); }

        /* Utility */
        .quiz { display:flex; flex-direction:column; gap:16px; }
  .quiz-actions { display:none; }
  .quiz-actions-below {
    display: flex;
    justify-content: flex-end;
    margin-top: 0px;
    margin-bottom: 0;
    position: relative;
    background: none;
    padding: 0 2vw 0 0;
    z-index: 2;
  }
  @media (max-width: 900px) {
    .quiz-actions-below {
      margin-top: 0px;
      padding-right: 0;
    }
  }
        .download-hint { margin-top:8px; font-size:12px; color:#fde68a; opacity:.9; }
        .tally-details { margin-top:10px; color:#475569; }
        .tally-grid { margin-top:8px; display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .tally-item { border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; color:#1f2937; }
        .tally-eyebrow { color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
        .tally-value { font-size:20px; font-weight:700; }
      `}</style>
    </div>
  );
}
