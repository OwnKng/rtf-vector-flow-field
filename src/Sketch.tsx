import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import { createNoise3D } from "simplex-noise"
import * as THREE from "three"
import { Vector2 } from "three"

const noise = createNoise3D()

const TWO_PI = Math.PI * 2

const width = 20
const height = 20

const rows = 50
const cols = 50
const numberOfCells = rows * cols

const cellWidth = width / cols
const cellHeight = height / rows

const grid = Array.from({ length: numberOfCells }, (_, i) => {
  const u = ((i % cols) * cellWidth) / width
  const v = (Math.floor(i / rows) * cellHeight) / height

  const angle = noise(u, v, 123) * TWO_PI * 4

  const x = Math.cos(angle)
  const y = Math.sin(angle)

  return new THREE.Vector2(x, y).setLength(10)
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
    particle.velocity.x = 0
  }

  if (particle.position.x < 0) {
    particle.velocity.x = 0
  }

  if (particle.position.y > height) {
    particle.velocity.y = 0
  }

  if (particle.position.y < 0) {
    particle.velocity.y = 0
  }
}

const Particle = (particle: particleType) => {
  const follow = () => {
    const x = Math.floor(particle.position.x / cellWidth)
    const y = Math.floor(particle.position.y / cellHeight)

    const index = x + y * cols
    const force = grid[index] || new THREE.Vector2(0, 0)
    force.setLength(particle.maxForce)

    applyForce(particle, force)
  }

  const drawCurve = (origin: THREE.Vector2) =>
    Array.from({ length: 250 }, () => {
      follow()
      updatePosition(particle)
      checkEdges({ width, height }, particle)

      return new THREE.Vector3(
        particle.position.x,
        particle.position.y,
        particle.velocity.length() * 5
      )
    })

  const points = drawCurve(particle.position)
  const curve = new THREE.CatmullRomCurve3(points)

  const geometry = new THREE.TubeGeometry(curve, 250, 0.01, 8, false)
  const material = new THREE.MeshBasicMaterial()

  return <primitive object={new THREE.Mesh(geometry, material)} />
}

export default function Sketch() {
  const particles = useMemo(
    () =>
      Array.from({ length: 500 }, () => ({
        position: new THREE.Vector2(
          Math.random() * width,
          Math.random() * height
        ),
        velocity: new THREE.Vector2().random(),
        acceleration: new THREE.Vector2(0, 0),
        maxSpeed: 0.1,
        maxForce: 0.01,
      })),
    []
  )

  return (
    <>
      {particles.map((p) => (
        <Particle {...p} />
      ))}
    </>
  )
}
