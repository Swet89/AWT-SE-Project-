import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import Lenis from 'lenis'

export default function ScrollExperience() {
  const location = useLocation()
  const progressRef = useRef(null)
  const capsuleRef = useRef(null)
  const lenisRef = useRef(null)
  const rafIdRef = useRef(null)

  // Coalesced visual scroll indicators via requestAnimationFrame
  const updateIndicators = (progress) => {
    if (rafIdRef.current) return
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null
      const p = Math.max(0, Math.min(1, progress || 0))
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${p})`
      }
      if (capsuleRef.current) {
        const maxTravel = Math.max(0, window.innerHeight - 170)
        capsuleRef.current.style.transform = `translateY(${p * maxTravel}px)`
        if (p > 0.01) {
          capsuleRef.current.classList.add('active')
        } else {
          capsuleRef.current.classList.remove('active')
        }
      }
    })
  }

  // Smooth & responsive Lenis scrolling
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let lenis = null
    let tick = null

    if (!reducedMotion.matches) {
      lenis = new Lenis({
        duration: 0.72, // Responsive, snappy, no sluggish drag
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.0,
        syncTouch: false, // Maintain native high-refresh-rate touch on mobile
        prevent: (node) => {
          return (
            node?.hasAttribute?.('data-lenis-prevent') ||
            Boolean(node?.closest?.('[data-lenis-prevent], .odyssey-chat-messages, .odyssey-chat-window, aside[aria-label="Odyssey AI Travel Concierge"]'))
          )
        },
      })
      lenisRef.current = lenis
      window.__odysseyLenis = lenis

      tick = (time) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(500, 33)

      lenis.on('scroll', (e) => {
        const progress = typeof e.progress === 'number'
          ? e.progress
          : (document.documentElement.scrollHeight > window.innerHeight
              ? e.scroll / (document.documentElement.scrollHeight - window.innerHeight)
              : 0)
        updateIndicators(progress)
      })
    }

    const onNativeScroll = () => {
      if (lenisRef.current) return
      const doc = document.documentElement
      const maxScroll = doc.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      updateIndicators(progress)
    }
    window.addEventListener('scroll', onNativeScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onNativeScroll)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (lenis) {
        lenisRef.current = null
        delete window.__odysseyLenis
        lenis.destroy()
      }
      if (tick) gsap.ticker.remove(tick)
    }
  }, [])

  // Instant scroll-to-top and indicator reset on page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true })
    }
    if (progressRef.current) progressRef.current.style.transform = 'scaleX(0)'
    if (capsuleRef.current) {
      capsuleRef.current.style.transform = 'translateY(0px)'
      capsuleRef.current.classList.remove('active')
    }
  }, [location.pathname])

  // High-performance native IntersectionObserver for scroll reveals (Zero MutationObserver lag)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('[data-reveal]').forEach((el) => {
        el.classList.add('is-revealed')
      })
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            obs.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.05,
      }
    )

    // Observe all current reveal elements
    const elements = document.querySelectorAll('[data-reveal]')
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('is-revealed')
      } else {
        observer.observe(el)
      }
    })

    return () => observer.disconnect()
  }, [location.pathname])

  return (
    <>
      <div
        ref={progressRef}
        className="odyssey-scroll-progress"
        aria-hidden="true"
        style={{ transform: 'scaleX(0)' }}
      />
      <div
        ref={capsuleRef}
        className="odyssey-modern-scroller"
        aria-hidden="true"
      >
        <div className="scroller-capsule" />
      </div>
    </>
  )
}
