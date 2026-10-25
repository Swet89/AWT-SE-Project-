import { useEffect, useRef, useState } from 'react'

const melody = [293.66, 349.23, 440, 523.25, 440, 349.23, 392, 349.23]

export default function BackgroundMusic() {
  const [playing, setPlaying] = useState(false)
  const stopMusicRef = useRef(null)

  useEffect(() => () => stopMusicRef.current?.(), [])

  async function toggleMusic() {
    if (stopMusicRef.current) {
      stopMusicRef.current()
      stopMusicRef.current = null
      setPlaying(false)
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const context = new AudioContextClass()
    await context.resume()
    const master = context.createGain()
    master.gain.value = 0.22
    master.connect(context.destination)

    const pad = [146.83, 220]
    const padOscillators = pad.map((frequency) => {
      const oscillator = context.createOscillator()
      const volume = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      volume.gain.value = 0.08
      oscillator.connect(volume)
      volume.connect(master)
      oscillator.start()
      return oscillator
    })

    let noteIndex = 0
    const playNote = () => {
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      const now = context.currentTime
      oscillator.type = 'triangle'
      oscillator.frequency.value = melody[noteIndex % melody.length]
      envelope.gain.setValueAtTime(0.0001, now)
      envelope.gain.exponentialRampToValueAtTime(0.16, now + 0.04)
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.72)
      oscillator.connect(envelope)
      envelope.connect(master)
      oscillator.start(now)
      oscillator.stop(now + 0.75)
      noteIndex += 1
    }

    playNote()
    const timer = window.setInterval(playNote, 900)
    stopMusicRef.current = () => {
      window.clearInterval(timer)
      padOscillators.forEach((oscillator) => oscillator.stop())
      context.close()
    }
    setPlaying(true)
  }

  return (
    <button
      className="nav-control-button music-control"
      type="button"
      onClick={toggleMusic}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      aria-pressed={playing}
      title="Ambient background music"
    >
      {playing ? '♫ Pause' : '♫ Music'}
    </button>
  )
}
