import { useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { createNoise2D } from "simplex-noise"
import * as THREE from "three"
import { Vector2 } from "three"
import fragment from "./shader/fragment.glsl"
import vertex from "./shader/vertex.glsl"

const noise = createNoise2D()

const rows = 100
const cols = 100

const createFlowField = (
  width: number,
  height: number,
  rows: number,
  cols: number
) =>
  Array.from({ length: rows * cols }, (_, i) => {
    const cellWidth = width / cols
    const cellHeight = height / rows

    const u = ((i % cols) * cellWidth) / width
    const v = (Math.floor(i / rows) * cellHeight) / height

    const angle = noise(u, v) * Math.PI * 0.5

    const x = Math.cos(angle)
    const y = Math.sin(angle)

    return new THREE.Vector2(x, y)
  })

type particleType = {
  acceleration: Vector2
  velocity: Vector2
  position: Vector2
  maxSpeed: number
  maxForce: number
}

type dimensionsType = {
  width: number
  height: number
}

const applyForce = (particle: particleType, force: THREE.Vector2) =>
  particle.acceleration.add(force)

const updatePosition = (particle: particleType) => {
  particle.velocity.add(particle.acceleration)
  particle.velocity.setLength(particle.maxSpeed)
  particle.acceleration.multiplyScalar(0)

  particle.position.add(particle.velocity)
}

const checkEdges = (dimensions: dimensionsType, particle: particleType) => {
  const { width, height } = dimensions

  if (particle.position.x > width) {
    particle.velocity.multiplyScalar(0)
  }

  if (particle.position.x < 0) {
    particle.velocity.multiplyScalar(0)
  }

  if (particle.position.y > height) {
    particle.velocity.multiplyScalar(0)
  }

  if (particle.position.y < 0) {
    particle.velocity.multiplyScalar(0)
  }
}

type ParticleProps = {
  particle: particleType
  grid: THREE.Vector2[]
}

const Particle = ({ particle, grid }: ParticleProps) => {
  const { viewport } = useThree()

  const follow = () => {
    const x = Math.floor(particle.position.x / (viewport.width / cols))
    const y = Math.floor(particle.position.y / (viewport.height / rows))

    const index = x + y * cols
    const force = grid[index] || new THREE.Vector2(0, 0)
    force.setLength(particle.maxForce)

    applyForce(particle, force)
  }

  const drawCurve = (origin: THREE.Vector2) =>
    Array.from({ length: 200 }, () => {
      follow()
      updatePosition(particle)
      checkEdges({ width: viewport.width, height: viewport.height }, particle)

      return new THREE.Vector3(particle.position.x, particle.position.y, 0)
    })

  const points = drawCurve(particle.position)
  const curve = new THREE.CatmullRomCurve3(points)

  const geometry = new THREE.TubeGeometry(curve, 64, 0.01, 3, false)
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: 0 },
      uOffset: { value: Math.random() },
      uSpeed: { value: 1 + Math.random() },
    },
    blending: THREE.AdditiveBlending,
  })

  useFrame(
    ({ clock }) => (material.uniforms.uTime.value = clock.getElapsedTime())
  )

  return <primitive object={new THREE.Mesh(geometry, material)} />
}

export default function Sketch() {
  const { viewport } = useThree()

  const particles = useMemo(
    () =>
      Array.from({ length: 2500 }, () => ({
        position: new THREE.Vector2(
          Math.random() * viewport.width,
          Math.random() * viewport.height
        ),
        velocity: new THREE.Vector2().random(),
        acceleration: new THREE.Vector2(0, 0),
        maxSpeed: 0.015,
        maxForce: 0.025,
      })),
    []
  )

  const flowField = useMemo(
    () => createFlowField(viewport.width, viewport.height, rows, cols),
    [viewport]
  )

  return (
    <group position={[-viewport.width * 0.5, -viewport.height * 0.5, 0]}>
      {particles.map((p, i) => (
        <Particle key={`particle-${i}`} particle={p} grid={flowField} />
      ))}
    </group>
  )
}
