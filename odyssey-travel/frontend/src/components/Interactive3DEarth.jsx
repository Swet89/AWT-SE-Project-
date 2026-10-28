import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { GLOBE_DESTINATIONS } from '../data/globeDestinations.js'

// Math helper: Converts (lat, lng) to 3D Cartesian coordinates on a sphere of given radius.
// Three.js convention: Y is up.
export function latLngToVector3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

export default function Interactive3DEarth({
  onSelectDestination,
  selectedDestinationId,
  isCardOpen,
  onResetTrigger
}) {
  const containerRef = useRef(null)
  const mountRef = useRef(null)
  const [hoveredDest, setHoveredDest] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [isHoveringMarker, setIsHoveringMarker] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Internal 3D scene state refs (to avoid re-renders on animation loops)
  const sceneStateRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    globeGroup: null,
    markersGroup: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    isDragging: false,
    prevMousePos: { x: 0, y: 0 },
    rotationVelocity: { x: 0, y: 0.003 },
    lastInteractionTime: Date.now(),
    targetCameraDistance: 3.8,
    currentCameraDistance: 3.8,
    baseCameraDistance: 3.8,
    markers: [],
    animationFrameId: null,
    isDestroyed: false,
  })

  // Format INR price for tooltip
  const formatPrice = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const state = sceneStateRef.current
    state.isDestroyed = false

    // Check WebGL availability
    const testCanvas = document.createElement('canvas')
    const hasWebGL = Boolean(testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'))
    if (!hasWebGL) return

    // 1. Scene & Camera Setup
    const width = container.clientWidth || 600
    const height = container.clientHeight || 600
    const scene = new THREE.Scene()
    state.scene = scene

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 0, state.baseCameraDistance)
    state.camera = camera

    // 2. Renderer with smooth anti-aliasing & device pixel ratio
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    state.renderer = renderer

    // 3. Lighting: Sophisticated cinematic lighting matching dark Aegean teal & cyan
    const ambientLight = new THREE.AmbientLight(0xdff4f7, 0.85)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff3d1, 2.8)
    sunLight.position.set(5, 3, 5)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x32a5b8, 1.6)
    rimLight.position.set(-6, -2, -4)
    scene.add(rimLight)

    // 4. Globe Object Group
    const globeGroup = new THREE.Group()
    // Initial tilt: Tilt slightly down and towards Asia/India for immediate visual impact
    globeGroup.rotation.x = 0.22
    globeGroup.rotation.y = -1.35
    scene.add(globeGroup)
    state.globeGroup = globeGroup

    const globeRadius = 1.35

    // 5. Earth Sphere Mesh & High-Quality Texture Loading
    const textureLoader = new THREE.TextureLoader()
    const dayTexture = textureLoader.load(
      '/textures/earth-blue-marble.jpg',
      () => renderer.render(scene, camera),
      undefined,
      (err) => console.warn('Could not load local Earth day texture, using procedural fallback', err)
    )

    // Primary Earth surface
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64)
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: dayTexture,
      roughness: 0.65,
      metalness: 0.1,
      color: 0xcee5e8,
    })
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial)
    globeGroup.add(earthMesh)

    // 6. Atmospheric Glow Layer (Soft cyan Fresnel/halo sphere slightly above surface)
    const atmosphereGeo = new THREE.SphereGeometry(globeRadius * 1.025, 48, 48)
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.25, 0.72, 0.84, 1.0) * intensity * 0.95;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat)
    globeGroup.add(atmosphereMesh)

    // 7. Subtle Night Atmosphere & Celestial Latitude Rings
    const gridGeo = new THREE.SphereGeometry(globeRadius * 1.002, 36, 18)
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x48a0b0,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    globeGroup.add(new THREE.Mesh(gridGeo, gridMat))

    // 8. Destination Markers Creation
    const markersGroup = new THREE.Group()
    globeGroup.add(markersGroup)
    state.markersGroup = markersGroup

    const markersList = []

    GLOBE_DESTINATIONS.forEach((dest) => {
      const pos = latLngToVector3(dest.latitude, dest.longitude, globeRadius * 1.008)

      // Marker container group oriented along normal
      const markerObj = new THREE.Group()
      markerObj.position.copy(pos)
      markerObj.lookAt(pos.clone().multiplyScalar(2))

      // Glowing core sphere (interactive target for raycaster)
      const coreGeo = new THREE.SphereGeometry(0.024, 16, 16)
      const isSelected = dest.id === selectedDestinationId
      const coreMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xfff4bd : 0xe4c98e,
      })
      const coreMesh = new THREE.Mesh(coreGeo, coreMat)
      coreMesh.userData = { destination: dest }
      markerObj.add(coreMesh)

      // Outer pulsing ripple ring
      const ringGeo = new THREE.RingGeometry(0.035, 0.052, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xe4c98e : 0x54d2e0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.65,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      markerObj.add(ringMesh)

      // Vertical beacon line pointing upward from surface
      const pinGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.06, 8)
      pinGeo.translate(0, 0.03, 0)
      const pinMat = new THREE.MeshBasicMaterial({
        color: 0xe4c98e,
        transparent: true,
        opacity: 0.75,
      })
      const pinMesh = new THREE.Mesh(pinGeo, pinMat)
      pinMesh.rotation.x = Math.PI / 2
      markerObj.add(pinMesh)

      markersGroup.add(markerObj)

      markersList.push({
        group: markerObj,
        coreMesh,
        ringMesh,
        destination: dest,
        baseScale: 1,
      })
    })

    state.markers = markersList

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || state.isDestroyed) return
      const w = container.clientWidth || 600
      const h = container.clientHeight || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // 10. Mouse & Touch Interaction Handlers
    const onPointerDown = (e) => {
      state.isDragging = true
      state.targetRotation = null
      state.prevMousePos = { x: e.clientX, y: e.clientY }
      state.rotationVelocity = { x: 0, y: 0 }
      state.lastInteractionTime = Date.now()
    }

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      state.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      state.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      if (state.isDragging) {
        const deltaX = e.clientX - state.prevMousePos.x
        const deltaY = e.clientY - state.prevMousePos.y

        // Natural drag rotation with subtle dampening
        const sensitivity = 0.0055
        globeGroup.rotation.y += deltaX * sensitivity
        globeGroup.rotation.x += deltaY * sensitivity

        // Clamp vertical pitch to prevent disorienting flip
        globeGroup.rotation.x = Math.max(-1.1, Math.min(1.1, globeGroup.rotation.x))

        state.rotationVelocity = {
          x: deltaY * sensitivity * 0.45,
          y: deltaX * sensitivity * 0.45,
        }

        state.prevMousePos = { x: e.clientX, y: e.clientY }
        state.lastInteractionTime = Date.now()
      } else {
        // Raycast to check for hover over destination markers
        state.raycaster.setFromCamera(state.mouse, camera)
        const hitCandidates = markersList.map((m) => m.coreMesh)
        const intersects = state.raycaster.intersectObjects(hitCandidates)

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object
          const dest = hitMesh.userData.destination

          // Occlusion check: ensure marker is on the facing side of the sphere
          const worldPos = new THREE.Vector3()
          hitMesh.getWorldPosition(worldPos)
          const camDir = camera.position.clone().sub(worldPos).normalize()
          const normal = worldPos.clone().normalize()
          const dot = normal.dot(camDir)

          if (dot > 0.15) {
            setHoveredDest(dest)
            setIsHoveringMarker(true)
            setTooltipPos({ x: e.clientX, y: e.clientY })
            state.lastInteractionTime = Date.now()
          } else {
            setHoveredDest(null)
            setIsHoveringMarker(false)
          }
        } else {
          setHoveredDest(null)
          setIsHoveringMarker(false)
        }
      }
    }

    const onPointerUp = (e) => {
      if (state.isDragging) {
        state.isDragging = false
        state.lastInteractionTime = Date.now()
      }

      // Check for click/tap selection
      const rect = renderer.domElement.getBoundingClientRect()
      const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1

      state.raycaster.setFromCamera(new THREE.Vector2(clickX, clickY), camera)
      const hitCandidates = markersList.map((m) => m.coreMesh)
      const intersects = state.raycaster.intersectObjects(hitCandidates)

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object
        const dest = hitMesh.userData.destination

        // Facing side check
        const worldPos = new THREE.Vector3()
        hitMesh.getWorldPosition(worldPos)
        const camDir = camera.position.clone().sub(worldPos).normalize()
        const normal = worldPos.clone().normalize()

        if (normal.dot(camDir) > 0.15 && onSelectDestination) {
          onSelectDestination(dest)

          // Smoothly center the destination in view
          if (dest.latitude !== undefined && dest.longitude !== undefined) {
            const radLat = (dest.latitude * Math.PI) / 180
            const radLon = (dest.longitude * Math.PI) / 180
            const targetY = -radLon - Math.PI / 2
            const targetX = Math.max(-0.6, Math.min(0.6, radLat * 0.65))

            // Shortest rotational path
            const twoPi = Math.PI * 2
            let diffY = ((targetY - globeGroup.rotation.y) % twoPi)
            if (diffY > Math.PI) diffY -= twoPi
            if (diffY < -Math.PI) diffY += twoPi

            state.targetRotation = {
              x: targetX,
              y: globeGroup.rotation.y + diffY
            }
          }
        }
      }
    }

    const onWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === 'function') {
        e.stopImmediatePropagation()
      }

      // Responsive zoom delta for both notch mouse wheels and fluid trackpads
      const delta = e.deltaY
      const factor = Math.abs(delta) > 40 ? 0.0024 : 0.005
      const zoomDelta = Math.sign(delta) * Math.min(Math.abs(delta) * factor, 0.45)

      state.targetCameraDistance = Math.max(2.1, Math.min(5.8, state.targetCameraDistance + zoomDelta))
      state.lastInteractionTime = Date.now()
    }

    // Touch handlers for mobile pinch zoom & smooth drag
    let touchStartDist = 0
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0])
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
      }
    }

    const onTouchMove = (e) => {
      if (e.touches.length === 1) {
        onPointerMove(e.touches[0])
      } else if (e.touches.length === 2) {
        e.preventDefault()
        e.stopPropagation()
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const pinchDelta = (touchStartDist - dist) * 0.006
        state.targetCameraDistance = Math.max(2.1, Math.min(5.8, state.targetCameraDistance + pinchDelta))
        touchStartDist = dist
      }
    }

    const onTouchEnd = (e) => {
      if (e.changedTouches.length > 0) {
        onPointerUp(e.changedTouches[0])
      }
      state.isDragging = false
    }

    const domElement = renderer.domElement
    const rootEl = containerRef.current
    domElement.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    domElement.addEventListener('wheel', onWheel, { passive: false })
    container.addEventListener('wheel', onWheel, { passive: false })
    if (rootEl) {
      rootEl.addEventListener('wheel', onWheel, { passive: false })
    }
    domElement.addEventListener('touchstart', onTouchStart, { passive: true })
    domElement.addEventListener('touchmove', onTouchMove, { passive: false })
    domElement.addEventListener('touchend', onTouchEnd)

    // 11. Render Animation Loop
    let clock = new THREE.Clock()

    const animate = () => {
      if (state.isDestroyed) return
      state.animationFrameId = requestAnimationFrame(animate)

      const delta = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()

      // Smooth camera zoom interpolation
      state.currentCameraDistance += (state.targetCameraDistance - state.currentCameraDistance) * 0.1
      camera.position.z = state.currentCameraDistance
      setZoomLevel(Number(((state.baseCameraDistance / state.currentCameraDistance)).toFixed(2)))

      // Idle Rotation logic
      const isCardActive = Boolean(isCardOpen)
      const isHovering = Boolean(state.hoveredMesh)
      const timeSinceInteraction = Date.now() - state.lastInteractionTime

      if (state.targetRotation && !state.isDragging) {
        // Smoothly ease globe rotation towards selected destination
        globeGroup.rotation.y += (state.targetRotation.y - globeGroup.rotation.y) * 0.08
        globeGroup.rotation.x += (state.targetRotation.x - globeGroup.rotation.x) * 0.08
        if (
          Math.abs(state.targetRotation.y - globeGroup.rotation.y) < 0.003 &&
          Math.abs(state.targetRotation.x - globeGroup.rotation.x) < 0.003
        ) {
          state.targetRotation = null
        }
      } else if (!state.isDragging) {
        // Inertia decay
        globeGroup.rotation.y += state.rotationVelocity.y
        globeGroup.rotation.x += state.rotationVelocity.x
        state.rotationVelocity.x *= 0.94
        state.rotationVelocity.y *= 0.94

        // Faster, lively idle rotation when idle and not interacting
        if (timeSinceInteraction > 800 && !isCardActive && !isHovering) {
          globeGroup.rotation.y += delta * 0.165
        }
      }

      // Marker pulse animation & depth occlusion
      const camPos = camera.position
      markersList.forEach((marker, index) => {
        const worldPos = new THREE.Vector3()
        marker.coreMesh.getWorldPosition(worldPos)

        const normal = worldPos.clone().normalize()
        const camDir = camPos.clone().sub(worldPos).normalize()
        const dot = normal.dot(camDir)

        // Occlude back-side markers so they don't show through the globe
        const isFacing = dot > 0.05
        marker.group.visible = isFacing

        if (isFacing) {
          // Dynamic scale based on facing angle & selection
          const isSelected = marker.destination.id === selectedDestinationId
          const isHovered = hoveredDest && hoveredDest.id === marker.destination.id

          const pulse = 1 + Math.sin(elapsedTime * 3.5 + index) * 0.16
          const targetScale = isSelected ? 1.65 : isHovered ? 1.35 : 1.0
          marker.group.scale.setScalar(pulse * targetScale)

          // Ripple opacity oscillation
          if (marker.ringMesh) {
            marker.ringMesh.material.opacity = 0.4 + Math.sin(elapsedTime * 4 + index) * 0.35
            if (isSelected) {
              marker.ringMesh.material.color.setHex(0xffea9f)
            } else {
              marker.ringMesh.material.color.setHex(0x54d2e0)
            }
          }
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // 12. Cleanup on Unmount
    return () => {
      state.isDestroyed = true
      cancelAnimationFrame(state.animationFrameId)
      resizeObserver.disconnect()

      domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      domElement.removeEventListener('wheel', onWheel)
      container.removeEventListener('wheel', onWheel)
      if (rootEl) {
        rootEl.removeEventListener('wheel', onWheel)
      }
      domElement.removeEventListener('touchstart', onTouchStart)
      domElement.removeEventListener('touchmove', onTouchMove)
      domElement.removeEventListener('touchend', onTouchEnd)

      if (container && renderer.domElement) {
        container.innerHTML = ''
      }
      renderer.dispose()
    }
  }, [selectedDestinationId, isCardOpen])

  // Reset Globe Orientation & Zoom
  const handleReset = useCallback(() => {
    const state = sceneStateRef.current
    if (!state.globeGroup || !state.camera) return

    // Smoothly restore default tilt facing India/Asia
    state.globeGroup.rotation.set(0.22, -1.35, 0)
    state.rotationVelocity = { x: 0, y: 0.003 }
    state.targetCameraDistance = state.baseCameraDistance
    state.lastInteractionTime = Date.now()
  }, [])

  // Manual Zoom In & Out buttons
  const handleZoomIn = () => {
    const state = sceneStateRef.current
    state.targetCameraDistance = Math.max(2.1, state.targetCameraDistance - 0.45)
    state.lastInteractionTime = Date.now()
  }

  const handleZoomOut = () => {
    const state = sceneStateRef.current
    state.targetCameraDistance = Math.min(5.8, state.targetCameraDistance + 0.45)
    state.lastInteractionTime = Date.now()
  }

  // React to parent reset trigger if provided
  useEffect(() => {
    if (onResetTrigger) handleReset()
  }, [onResetTrigger, handleReset])

  return (
    <div
      ref={containerRef}
      className="interactive-earth-container"
      data-lenis-prevent="true"
    >
      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        data-lenis-prevent="true"
        className={`interactive-earth-canvas ${isHoveringMarker ? 'cursor-pointer' : 'cursor-grab'}`}
        role="region"
        aria-label="Interactive 3D Earth Globe. Drag to rotate, scroll to zoom, click any glowing marker to explore a destination."
      />

      {/* Floating HUD Controls */}
      <div className="earth-hud-controls" aria-label="Globe view controls">
        <button
          type="button"
          onClick={handleZoomIn}
          className="earth-hud-btn"
          title="Zoom into globe (+)"
          aria-label="Zoom into globe"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="earth-hud-btn"
          title="Zoom out from globe (-)"
          aria-label="Zoom out from globe"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="earth-hud-btn earth-reset-btn"
          title="Reset globe orientation to default"
          aria-label="Reset globe orientation"
        >
          ↺
        </button>
      </div>

      {/* Mini status indicator */}
      <div className="earth-badge-hint">
        <span className="earth-pulse-dot" />
        <span>3D World Discovery • {GLOBE_DESTINATIONS.length} Live Gateways</span>
      </div>

      {/* Live Hover Tooltip */}
      {hoveredDest && (
        <aside
          className="earth-marker-tooltip"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y - 14}px`,
          }}
          aria-live="polite"
        >
          <div className="tooltip-title">{hoveredDest.name}</div>
          <div className="tooltip-sub">
            {hoveredDest.state ? `${hoveredDest.state}, ` : ''}{hoveredDest.country} • From {formatPrice(hoveredDest.budgetPerDayINR)}
          </div>
        </aside>
      )}
    </div>
  )
}
