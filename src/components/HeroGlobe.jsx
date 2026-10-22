import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const cities = [
  { name: 'Athens', latitude: 37.98, longitude: 23.72 },
  { name: 'Goa', latitude: 15.3, longitude: 74.1 },
  { name: 'Delhi', latitude: 28.61, longitude: 77.21 },
  { name: 'Bali', latitude: -8.34, longitude: 115.09 },
]

const globePoint = (latitude, longitude, radius) => {
  const phi = ((90 - latitude) * Math.PI) / 180
  const theta = ((longitude + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function RouteArc({ from, to }) {
  const geometry = useMemo(() => {
    const start = globePoint(from.latitude, from.longitude, 1.32)
    const end = globePoint(to.latitude, to.longitude, 1.32)
    const control = start.clone().add(end).normalize().multiplyScalar(1.72)
    const curve = new THREE.QuadraticBezierCurve3(start, control, end)
    return new THREE.TubeGeometry(curve, 48, 0.006, 6, false)
  }, [from, to])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#e6bf72" transparent opacity={0.85} />
    </mesh>
  )
}

function Globe() {
  const globeRef = useRef(null)

  useFrame((_, delta) => {
    if (globeRef.current) globeRef.current.rotation.y += delta * 0.075
  })

  return (
    <group ref={globeRef} rotation={[0.08, -0.65, 0.08]}>
      <mesh>
        <sphereGeometry args={[1.3, 56, 56]} />
        <meshStandardMaterial color="#155064" roughness={0.76} metalness={0.12} />
      </mesh>
      <mesh scale={1.002}>
        <sphereGeometry args={[1.3, 24, 18]} />
        <meshBasicMaterial color="#83c0c1" wireframe transparent opacity={0.17} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.307, 40, 40]} />
        <meshBasicMaterial color="#52b7c1" wireframe transparent opacity={0.12} />
      </mesh>

      <RouteArc from={cities[0]} to={cities[2]} />
      <RouteArc from={cities[2]} to={cities[1]} />
      <RouteArc from={cities[1]} to={cities[3]} />

      {cities.map((city) => (
        <mesh key={city.name} position={globePoint(city.latitude, city.longitude, 1.32)}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial color="#f3d48d" />
        </mesh>
      ))}
    </group>
  )
}

function StaticGlobe() {
  return (
    <div className="hero-globe-static" role="img" aria-label="Illustrated globe with golden travel routes">
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <defs>
          <radialGradient id="globe-fill" cx="35%" cy="30%">
            <stop offset="0" stopColor="#287b87" />
            <stop offset="1" stopColor="#0d3346" />
          </radialGradient>
        </defs>
        <circle cx="150" cy="150" r="126" fill="url(#globe-fill)" stroke="#d8b979" strokeOpacity=".55" />
        <ellipse cx="150" cy="150" rx="58" ry="126" fill="none" stroke="#b7d6d0" strokeOpacity=".25" />
        <ellipse cx="150" cy="150" rx="101" ry="126" fill="none" stroke="#b7d6d0" strokeOpacity=".18" />
        <path d="M27 150h246M45 100c63 28 147 28 210 0M45 200c63-28 147-28 210 0" fill="none" stroke="#b7d6d0" strokeOpacity=".25" />
        <path d="M84 155Q135 69 205 119T227 174" fill="none" stroke="#f0cf83" strokeWidth="2" />
        <circle cx="84" cy="155" r="4" fill="#f0cf83" />
        <circle cx="205" cy="119" r="4" fill="#f0cf83" />
        <circle cx="227" cy="174" r="4" fill="#f0cf83" />
      </svg>
    </div>
  )
}

export default function HeroGlobe() {
  const [useStatic, setUseStatic] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 700px)')
    const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4
    const fewCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
    const saveData = navigator.connection?.saveData
    const canvas = document.createElement('canvas')
    const hasWebGL = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))

    const updateMode = () => setUseStatic(Boolean(media.matches || lowMemory || fewCores || saveData || !hasWebGL))
    updateMode()
    media.addEventListener?.('change', updateMode)
    return () => media.removeEventListener?.('change', updateMode)
  }, [])

  if (useStatic) return <StaticGlobe />

  return (
    <div className="hero-globe-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.1], fov: 36 }} dpr={[1, 1.5]}>
        <ambientLight intensity={1.15} />
        <directionalLight position={[3, 3, 4]} intensity={2.2} color="#ffe3a4" />
        <pointLight position={[-3, -2, -3]} intensity={1.6} color="#4298aa" />
        <Globe />
      </Canvas>
    </div>
  )
}
