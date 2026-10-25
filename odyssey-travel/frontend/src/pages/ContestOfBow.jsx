import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Phaser from 'phaser'

const API = 'http://localhost:5000/api'
const AXE_COUNT = 12

function BowGame({ onFinish }) {
  const mountRef = useRef(null)
  const gameRef = useRef(null)
  const onFinishRef = useRef(onFinish)
  const [hitTargets, setHitTargets] = useState([])

  onFinishRef.current = onFinish

  useEffect(() => {
    const startTime = Date.now()
    const hit = new Set()
    let score = 0
    let secondsLeft = 25
    let finished = false

    class ContestScene extends Phaser.Scene {
      constructor() {
        super('contest')
      }

      create() {
        const { width, height } = this.scale
        this.cameras.main.setBackgroundColor('#101b24')

        const scenery = this.add.graphics()
        scenery.fillStyle(0x172a32, 1)
        scenery.fillRect(0, height - 105, width, 105)
        scenery.lineStyle(2, 0xd9b777, 0.65)
        scenery.lineBetween(245, 95, width - 55, 95)
        scenery.lineBetween(245, height - 86, width - 55, height - 86)

        this.add.text(34, 26, 'THE CONTEST OF THE BOW', {
          fontFamily: 'Georgia, serif',
          fontSize: '22px',
          color: '#f7f0df',
          letterSpacing: 2,
        })
        this.scoreLabel = this.add.text(36, 68, 'AXES HIT  0 / 12', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#e3c68f',
          fontStyle: 'bold',
        })
        this.timerLabel = this.add.text(width - 170, 30, 'TIME  25', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
          color: '#e3c68f',
          fontStyle: 'bold',
        })
        this.add.text(36, height - 64, 'Choose an axe below and loose your arrow.', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '15px',
          color: '#d5dce0',
        })

        const bow = this.add.graphics()
        bow.lineStyle(7, 0xd9b777, 1)
        bow.beginPath()
        bow.arc(155, height - 88, 60, Phaser.Math.DegToRad(255), Phaser.Math.DegToRad(105), false)
        bow.strokePath()
        bow.lineStyle(2, 0xf7f0df, 0.8)
        bow.lineBetween(140, height - 143, 140, height - 33)

        this.targets = []
        for (let index = 0; index < AXE_COUNT; index += 1) {
          const column = index % 4
          const row = Math.floor(index / 4)
          const x = 340 + column * 145
          const y = 175 + row * 102
          const target = this.add.graphics()
          target.lineStyle(3, 0xe3c68f, 0.85)
          target.strokeCircle(x, y, 31)
          target.lineStyle(2, 0xd7e0dd, 0.7)
          target.strokeCircle(x, y, 22)
          target.fillStyle(0xc27b4b, 1)
          target.fillTriangle(x - 8, y - 14, x - 25, y - 31, x + 1, y - 34)
          target.fillTriangle(x + 8, y - 14, x + 25, y - 31, x - 1, y - 34)
          target.lineStyle(5, 0xc99c5d, 1)
          target.lineBetween(x, y - 17, x, y + 24)
          target.fillStyle(0xe3c68f, 1)
          target.fillCircle(x, y, 4)
          this.targets.push({ x, y })
          this.add.text(x - 8, y + 35, String(index + 1), {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#f7f0df',
          })
        }

        this.events.on('shoot-target', (index) => this.shootTarget(index))
        this.timerEvent = this.time.addEvent({
          delay: 1000,
          loop: true,
          callback: () => {
            if (finished) return
            secondsLeft -= 1
            this.timerLabel.setText(`TIME  ${secondsLeft}`)
            if (secondsLeft <= 0) finishGame()
          },
        })
      }

      shootTarget(index) {
        if (finished || hit.has(index) || index < 0 || index >= AXE_COUNT) return
        hit.add(index)
        score += 1
        setHitTargets([...hit])
        this.scoreLabel.setText(`AXES HIT  ${score} / 12`)

        const target = this.targets[index]
        const arrow = this.add.graphics()
        arrow.lineStyle(4, 0xe3c68f, 1)
        arrow.lineBetween(155, this.scale.height - 88, target.x, target.y)
        arrow.fillStyle(0xf7f0df, 1)
        arrow.fillTriangle(target.x, target.y, target.x - 12, target.y - 4, target.x - 5, target.y + 8)

        const hitMark = this.add.graphics()
        hitMark.fillStyle(0x72b58b, 0.95)
        hitMark.fillCircle(target.x, target.y, 11)
        hitMark.fillStyle(0xf7f0df, 1)
        hitMark.fillCircle(target.x, target.y, 4)

        if (score === AXE_COUNT) finishGame()
      }
    }

    function finishGame() {
      if (finished) return
      finished = true
      onFinishRef.current(score, Math.max(3000, Date.now() - startTime))
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 960,
      height: 500,
      parent: mountRef.current,
      backgroundColor: '#101b24',
      scene: ContestScene,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: { antialias: true, pixelArt: false },
      audio: { noAudio: true },
    })
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [])

  return (
    <>
      <div className="bow-game-canvas" ref={mountRef} aria-hidden="true" />
      <div className="bow-target-controls" aria-label="Axe targets">
        {Array.from({ length: AXE_COUNT }, (_, index) => {
          const alreadyHit = hitTargets.includes(index)
          return (
            <button
              type="button"
              key={index}
              disabled={alreadyHit}
              onClick={() => gameRef.current?.scene.getScene('contest').events.emit('shoot-target', index)}
              aria-label={`Shoot at axe ${index + 1}${alreadyHit ? ', already hit' : ''}`}
            >
              {alreadyHit ? '✓' : `Axe ${index + 1}`}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default function ContestOfBow() {
  const [status, setStatus] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingResult, setPendingResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const token = sessionStorage.getItem('odysseyAccessToken')

  useEffect(() => {
    const controller = new AbortController()
    axios
      .get(`${API}/game/status`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      .then((response) => setStatus(response.data))
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load your game status.')
        }
      })
    return () => controller.abort()
  }, [token])

  const submitScore = useCallback(async (result) => {
    setSubmitting(true)
    setError('')
    try {
      const response = await axios.post(
        `${API}/game/submit`,
        result,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      const updatedStatus = {
        canPlay: false,
        gamePlayed: true,
        score: response.data.score,
        coupon: { ...response.data.coupon, redeemed: false },
      }
      setStatus(updatedStatus)
      sessionStorage.setItem('odysseyGameCoupon', response.data.coupon.code)
      sessionStorage.setItem(
        'odysseyGameDiscountPercent',
        String(response.data.coupon.discountPercent),
      )
      setPendingResult(null)
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        try {
          const latest = await axios.get(`${API}/game/status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (latest.data.gamePlayed) {
            setStatus(latest.data)
            if (latest.data.coupon) {
              sessionStorage.setItem('odysseyGameCoupon', latest.data.coupon.code)
              sessionStorage.setItem(
                'odysseyGameDiscountPercent',
                String(latest.data.coupon.discountPercent),
              )
            }
            setPendingResult(null)
            setError('')
            return
          }
        } catch {
          // Keep the original submission error visible if the status check fails.
        }
      }
      setError(requestError.response?.data?.message || 'Could not save the score. Try submitting again.')
    } finally {
      setSubmitting(false)
    }
  }, [token])

  function handleFinish(score, durationMs) {
    setPlaying(false)
    const result = { score, durationMs }
    setPendingResult(result)
    submitScore(result)
  }

  async function copyCoupon() {
    if (!status?.coupon?.code) return
    await navigator.clipboard.writeText(status.coupon.code)
    setCopied(true)
  }

  return (
    <main className="contest-page">
      <header className="contest-heading">
        <p className="eyebrow dark">ODYSSEUS’ FINAL TRIAL</p>
        <h1>Contest of the Bow</h1>
        <p>Strike all twelve axe targets before time runs out to earn your travel discount.</p>
      </header>

      {error && <p className="error-message" role="alert">{error}</p>}
      {!status && !error && <p className="page-message" role="status">Checking your game…</p>}

      {status?.gamePlayed && (
        <section className="contest-result" aria-live="polite">
          <p className="eyebrow dark">YOUR SCORE</p>
          <h2>{status.score} / 12 axes hit</h2>
          {status.coupon && (
            <>
              <p>You earned {status.coupon.discountPercent}% off a booking.</p>
              {status.coupon.redeemed ? (
                <p className="coupon-used">Coupon {status.coupon.code} has been used.</p>
              ) : (
                <div className="contest-coupon">
                  <code>{status.coupon.code}</code>
                  <button type="button" onClick={copyCoupon}>
                    {copied ? 'Copied' : 'Copy coupon'}
                  </button>
                  <Link to="/search/flights">Use coupon in travel search</Link>
                </div>
              )}
            </>
          )}
          <p className="one-play-note">This account has used its one game attempt.</p>
        </section>
      )}

      {status?.canPlay && !playing && !pendingResult && (
        <section className="contest-start-card">
          <p>You have one attempt. Hit each numbered axe target once within 25 seconds.</p>
          <p>Your discount is based on your score, from 5% to 15%.</p>
          <button type="button" onClick={() => { setError(''); setPlaying(true) }}>
            Begin challenge
          </button>
        </section>
      )}

      {playing && <BowGame onFinish={handleFinish} />}

      {pendingResult && submitting && (
        <p className="page-message" role="status">Recording your score and issuing your coupon…</p>
      )}
      {pendingResult && !submitting && (
        <button className="contest-retry-button" type="button" onClick={() => submitScore(pendingResult)}>
          Submit score again
        </button>
      )}
    </main>
  )
}
