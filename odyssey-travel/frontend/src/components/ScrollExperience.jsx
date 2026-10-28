import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollExperience() {
  const location = useLocation()
  const progressRef = useRef(null)
  const capsuleRef = useRef(null)
  const timeoutRef = useRef(null)
  const lenisRef = useRef(null)

  // Update visual scroll indicators directly via DOM for 120fps performance
  const updateIndicators = (progress) => {
    const p = Math.max(0, Math.min(1, progress || 0))
    if (progressRef.current) {
      progressRef.current.style.transform = `scaleX(${p})`
    }
    if (capsuleRef.current) {
      const maxTravel = Math.max(0, window.innerHeight - 170)
      const travel = p * maxTravel
      capsuleRef.current.style.transform = `translateY(${travel}px)`

      if (p > 0.005) {
        capsuleRef.current.classList.add('active')
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          if (capsuleRef.current) {
            capsuleRef.current.classList.remove('active')
          }
        }, 750)
      } else {
        capsuleRef.current.classList.remove('active')
      }
    }
  }

  // Smooth Lenis scrolling + ScrollTrigger sync
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    let lenis = null
    let tick = null
    let updateScrollTrigger = null

    if (!reducedMotion.matches) {
      lenis = new Lenis({
        duration: 1.05,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      })
      lenisRef.current = lenis

      updateScrollTrigger = () => ScrollTrigger.update()
      tick = (time) => lenis.raf(time * 1000)

      lenis.on('scroll', (e) => {
        updateScrollTrigger()
        const progress = typeof e.progress === 'number'
          ? e.progress
          : (document.documentElement.scrollHeight > window.innerHeight
              ? e.scroll / (document.documentElement.scrollHeight - window.innerHeight)
              : 0)
        updateIndicators(progress)
      })

      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
    }

    // Fallback native scroll listener (for reduced motion or direct scroll events)
    const onNativeScroll = () => {
      if (lenisRef.current) return // Lenis handler handles it
      const doc = document.documentElement
      const maxScroll = doc.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      updateIndicators(progress)
    }
    window.addEventListener('scroll', onNativeScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onNativeScroll)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (lenis) {
        lenis.off('scroll', updateScrollTrigger)
        lenisRef.current = null
        lenis.destroy()
      }
      if (tick) gsap.ticker.remove(tick)
    }
  }, [])

  // Route change reset
  useEffect(() => {
    if (progressRef.current) progressRef.current.style.transform = 'scaleX(0)'
    if (capsuleRef.current) {
      capsuleRef.current.style.transform = 'translateY(0px)'
      capsuleRef.current.classList.remove('active')
    }
  }, [location.pathname])

  // Reveal animations on scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const handled = new WeakSet()
    const reveal = (root) => {
      const applyReveal = (element) => {
        if (!element || handled.has(element)) return
        handled.add(element)

        const rect = element.getBoundingClientRect()
        const isAlreadyVisible = rect.top < window.innerHeight && rect.bottom > 0
        const isPastViewport = rect.bottom <= 0

        if (isPastViewport) {
          gsap.set(element, { autoAlpha: 1, y: 0 })
          return
        }

        if (isAlreadyVisible) {
          gsap.fromTo(element, { autoAlpha: 0, y: 14 }, {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            ease: 'power2.out',
          })
          return
        }

        gsap.fromTo(element, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        })
      }

      if (root instanceof Element && root.matches('[data-reveal]')) {
        applyReveal(root)
      }

      root.querySelectorAll?.('[data-reveal]').forEach(applyReveal)
    }

    const scope = document.getElementById('root')
    if (!scope) return undefined
    reveal(scope)

    let refreshTimeout
    const observer = new MutationObserver((mutations) => {
      let hasAdded = false
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          reveal(node)
          hasAdded = true
        }
      }))
      if (hasAdded) {
        clearTimeout(refreshTimeout)
        refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 100)
      }
    })
    observer.observe(scope, { childList: true, subtree: true })
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(refreshFrame)
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
      gsap.killTweensOf(scope.querySelectorAll('[data-reveal]'))
    }
  }, [location.pathname])

  return (
    <>
      {/* Sleek 2px gold/cyan reading progress indicator directly beneath header */}
      <div
        ref={progressRef}
        className="odyssey-scroll-progress"
        aria-hidden="true"
        style={{ transform: 'scaleX(0)' }}
      />

      {/* Modern floating scroller capsule on right edge (fades in while scrolling, fades out when idle) */}
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

