import { useEffect, useRef, useState } from 'react'

const SOUNDSCAPES = [
  {
    id: 'aegean',
    name: 'Aegean Dawn',
    icon: '🌊',
    tempoMs: 1400,
    filterFreq: 1600,
    chords: [
      [110.0, 164.81, 220.0, 261.63, 329.63], // Am9
      [87.31, 130.81, 174.61, 220.0, 261.63], // Fmaj7
      [65.41, 130.81, 196.0, 246.94, 329.63],  // Cmaj9
      [98.0, 146.83, 196.0, 261.63, 293.66],  // Gsus4
    ],
    melodyScale: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25],
  },
  {
    id: 'sanctuary',
    name: 'Starlit Sanctuary',
    icon: '🌌',
    tempoMs: 1800,
    filterFreq: 1300,
    chords: [
      [73.42, 146.83, 220.0, 261.63, 329.63], // Dm9
      [58.27, 116.54, 174.61, 220.0, 293.66], // Bbmaj7
      [98.0, 146.83, 174.61, 220.0, 293.66],  // Gm9
      [110.0, 164.81, 220.0, 293.66, 329.63], // Asus4
    ],
    melodyScale: [293.66, 329.63, 349.23, 440.0, 523.25, 587.33, 659.25],
  },
  {
    id: 'silkroad',
    name: 'Silk Road Horizon',
    icon: '✨',
    tempoMs: 1500,
    filterFreq: 1500,
    chords: [
      [82.41, 123.47, 164.81, 196.0, 246.94],  // Em9
      [87.31, 130.81, 174.61, 246.94, 261.63], // Fmaj7#11
      [73.42, 110.0, 146.83, 174.61, 246.94],  // Dm6
      [82.41, 123.47, 164.81, 220.0, 246.94],  // E7sus
    ],
    melodyScale: [164.81, 174.61, 220.0, 246.94, 261.63, 329.63, 392.0, 440.0],
  },
]

export default function BackgroundMusic() {
  const [playing, setPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)

  const audioEngineRef = useRef(null)
  const trackIndexRef = useRef(trackIndex)
  trackIndexRef.current = trackIndex

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop()
        audioEngineRef.current = null
      }
    }
  }, [])

  function createEngine(initialTrackIdx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return null

    const ctx = new AudioContextClass()

    // Master bus
    const master = ctx.createGain()
    master.gain.value = 0.18
    master.connect(ctx.destination)

    // Warm Lowpass Filter
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = SOUNDSCAPES[initialTrackIdx].filterFreq
    filter.Q.value = 1.0
    filter.connect(master)

    // Stereo-like ambient delay line for lush reverberation
    const delay = ctx.createDelay()
    delay.delayTime.value = 0.36
    const delayFeedback = ctx.createGain()
    delayFeedback.gain.value = 0.32
    const delayFilter = ctx.createBiquadFilter()
    delayFilter.type = 'lowpass'
    delayFilter.frequency.value = 1100

    delay.connect(delayFilter)
    delayFilter.connect(delayFeedback)
    delayFeedback.connect(delay)
    delayFeedback.connect(master)

    let currentChordNodes = []
    let currentChordIdx = 0
    let chordTimer = null
    let melodyTimer = null
    let isRunning = true

    function crossfadeChord(newChord) {
      if (!isRunning || ctx.state === 'closed') return

      const now = ctx.currentTime

      // Fade out previous chord smoothly
      currentChordNodes.forEach(({ gain, oscs }) => {
        try {
          gain.gain.cancelScheduledValues(now)
          gain.gain.setValueAtTime(gain.gain.value, now)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2)
          setTimeout(() => {
            oscs.forEach((o) => {
              try { o.stop(); o.disconnect() } catch (_) {}
            })
            try { gain.disconnect() } catch (_) {}
          }, 2400)
        } catch (_) {}
      })
      currentChordNodes = []

      // Create new lush detuned pad voices for new chord
      const newVoices = newChord.map((freq, voiceIdx) => {
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.type = voiceIdx === 0 ? 'sine' : 'triangle'
        osc2.type = 'sine'

        osc1.frequency.value = freq
        osc2.frequency.value = freq
        osc1.detune.value = -4
        osc2.detune.value = +4

        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.024, now + 2.6)

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(filter)

        osc1.start(now)
        osc2.start(now)

        return { gain, oscs: [osc1, osc2] }
      })

      currentChordNodes = newVoices
    }

    function scheduleChords() {
      const track = SOUNDSCAPES[trackIndexRef.current]
      const chord = track.chords[currentChordIdx % track.chords.length]
      crossfadeChord(chord)
      currentChordIdx += 1
      chordTimer = setTimeout(scheduleChords, 8200)
    }

    function playPluck() {
      if (!isRunning || ctx.state === 'closed') return

      const track = SOUNDSCAPES[trackIndexRef.current]
      const scale = track.melodyScale
      const noteFreq = scale[Math.floor(Math.random() * scale.length)]

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const shimmer = ctx.createOscillator()
      const env = ctx.createGain()
      const shimmerEnv = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(noteFreq, now)

      shimmer.type = 'sine'
      shimmer.frequency.setValueAtTime(noteFreq * 2, now) // 1 octave overtone shimmer

      env.gain.setValueAtTime(0.0001, now)
      env.gain.exponentialRampToValueAtTime(0.09, now + 0.025)
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)

      shimmerEnv.gain.setValueAtTime(0.0001, now)
      shimmerEnv.gain.exponentialRampToValueAtTime(0.02, now + 0.02)
      shimmerEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)

      osc.connect(env)
      shimmer.connect(shimmerEnv)

      env.connect(filter)
      env.connect(delay) // Send plucks to lush delay
      shimmerEnv.connect(filter)

      osc.start(now)
      shimmer.start(now)
      osc.stop(now + 1.6)
      shimmer.stop(now + 1.0)

      // Randomised organic rhythm: gentle pauses and varied spacing
      const variance = (Math.random() - 0.5) * 500
      melodyTimer = setTimeout(playPluck, Math.max(800, track.tempoMs + variance))
    }

    scheduleChords()
    melodyTimer = setTimeout(playPluck, 600)

    return {
      ctx,
      updateFilter: (freq) => {
        if (ctx.state !== 'closed') {
          filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.4)
        }
      },
      resetHarmony: () => {
        currentChordIdx = 0
        clearTimeout(chordTimer)
        scheduleChords()
      },
      stop: () => {
        isRunning = false
        clearTimeout(chordTimer)
        clearTimeout(melodyTimer)
        currentChordNodes.forEach(({ gain, oscs }) => {
          try {
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
            setTimeout(() => {
              oscs.forEach((o) => { try { o.stop(); o.disconnect() } catch (_) {} })
            }, 600)
          } catch (_) {}
        })
        setTimeout(() => {
          try { ctx.close() } catch (_) {}
        }, 700)
      },
    }
  }

  async function toggleMusic() {
    if (playing) {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop()
        audioEngineRef.current = null
      }
      setPlaying(false)
      return
    }

    const engine = createEngine(trackIndex)
    if (!engine) return

    await engine.ctx.resume()
    audioEngineRef.current = engine
    setPlaying(true)
  }

  function nextTrack(e) {
    e.stopPropagation()
    const nextIdx = (trackIndex + 1) % SOUNDSCAPES.length
    setTrackIndex(nextIdx)

    if (audioEngineRef.current) {
      const nextTrackDef = SOUNDSCAPES[nextIdx]
      audioEngineRef.current.updateFilter(nextTrackDef.filterFreq)
      audioEngineRef.current.resetHarmony()
    } else {
      // If paused, start playing the new track
      const engine = createEngine(nextIdx)
      if (engine) {
        engine.ctx.resume()
        audioEngineRef.current = engine
        setPlaying(true)
      }
    }
  }

  const currentTrack = SOUNDSCAPES[trackIndex]

  return (
    <div className={`music-control-group ${playing ? 'is-playing' : ''}`}>
      <button
        className={`nav-control-button music-control ${playing ? 'is-active' : ''}`}
        type="button"
        onClick={toggleMusic}
        aria-label={playing ? `Pause ${currentTrack.name}` : `Play ambient music: ${currentTrack.name}`}
        aria-pressed={playing}
        title={playing ? `Playing: ${currentTrack.name} (Click to pause)` : `Ambient Soundscape: ${currentTrack.name}`}
      >
        {playing ? (
          <>
            <span className="music-wave-bars" aria-hidden="true">
              <span className="wave-bar bar-1" />
              <span className="wave-bar bar-2" />
              <span className="wave-bar bar-3" />
            </span>
            <span className="music-track-title">{currentTrack.name}</span>
          </>
        ) : (
          <span>♫ Music</span>
        )}
      </button>

      {playing && (
        <button
          className="music-next-button"
          type="button"
          onClick={nextTrack}
          aria-label={`Switch to next track: ${SOUNDSCAPES[(trackIndex + 1) % SOUNDSCAPES.length].name}`}
          title={`Switch track: ${SOUNDSCAPES[(trackIndex + 1) % SOUNDSCAPES.length].name}`}
        >
          ⏭
        </button>
      )}
    </div>
  )
}
