import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const rootRef = useRef(null)
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const ring = ringRef.current
    const dot = dotRef.current
    const pointer = window.matchMedia('(pointer: fine) and (hover: hover)')

    if (!root || !ring || !dot || !pointer.matches) return undefined

    root.classList.add('is-active')
    document.documentElement.dataset.customCursor = 'active'

    let frame = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    function moveCursor(event) {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
      const target = event.target instanceof Element ? event.target : null

      // If hovering inside the chatbot window or standard form inputs, disable custom cursor so native cursor is used
      if (target?.closest('.odyssey-chat-window, input, textarea, select')) {
        root.classList.remove('is-active')
        return
      }

      root.classList.add('is-active')
      document.documentElement.dataset.customCursor = 'active'
      x = event.clientX
      y = event.clientY
      if (frame) return

      frame = window.requestAnimationFrame(() => {
        const position = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
        ring.style.transform = position
        dot.style.transform = position
        frame = 0
      })
    }

    function setCursorMode(event) {
      const target = event.target instanceof Element ? event.target : null
      const interactive = target?.closest('a, button, [role="button"], [draggable="true"], canvas, .home-destination-rail')
      if (!interactive) {
        root.dataset.mode = 'default'
        ring.dataset.label = ''
        return
      }

      const explicitLabel = interactive.getAttribute('data-cursor-label')
      const mode = explicitLabel === 'Drag' || interactive.matches('[draggable="true"], .home-destination-rail')
        ? 'drag'
        : explicitLabel === 'Play' || interactive.matches('canvas, .contest-game-canvas, .bow-game-canvas')
          ? 'play'
          : 'explore'

      root.dataset.mode = mode
      ring.dataset.label = explicitLabel || (mode === 'play' ? 'Play' : mode === 'drag' ? 'Drag' : 'Explore')
    }

    function useKeyboardNavigation(event) {
      if (['Tab', 'Enter', ' '].includes(event.key)) {
        root.classList.remove('is-active')
        delete document.documentElement.dataset.customCursor
      }
    }

    window.addEventListener('pointermove', moveCursor, { passive: true })
    window.addEventListener('keydown', useKeyboardNavigation)
    document.addEventListener('pointerover', setCursorMode, true)

    return () => {
      window.removeEventListener('pointermove', moveCursor)
      window.removeEventListener('keydown', useKeyboardNavigation)
      document.removeEventListener('pointerover', setCursorMode, true)
      if (frame) window.cancelAnimationFrame(frame)
      delete document.documentElement.dataset.customCursor
    }
  }, [])

  return (
    <div className="custom-cursor" ref={rootRef} aria-hidden="true">
      <span className="custom-cursor-ring" ref={ringRef} />
      <span className="custom-cursor-dot" ref={dotRef} />
    </div>
  )
}
