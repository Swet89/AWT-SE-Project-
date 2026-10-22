import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export default function ScrollExperience() {
  const location = useLocation()

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return undefined

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true })
    const updateScrollTrigger = () => ScrollTrigger.update()
    const tick = (time) => lenis.raf(time * 1000)
    lenis.on('scroll', updateScrollTrigger)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.off('scroll', updateScrollTrigger)
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const handled = new WeakSet()
    const reveal = (root) => {
      if (root instanceof Element && root.matches('[data-reveal]') && !handled.has(root)) {
        handled.add(root)
        gsap.fromTo(root, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          ease: 'power2.out',
          scrollTrigger: { trigger: root, start: 'top 90%', once: true },
        })
      }

      root.querySelectorAll?.('[data-reveal]').forEach((element) => {
        if (handled.has(element)) return
        handled.add(element)
        gsap.fromTo(element, { autoAlpha: 0, y: 18 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.58,
          ease: 'power2.out',
          scrollTrigger: { trigger: element, start: 'top 90%', once: true },
        })
      })
    }

    const scope = document.getElementById('root')
    if (!scope) return undefined
    reveal(scope)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) reveal(node)
      }))
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

  return null
}
