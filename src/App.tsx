import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import Sketch from "./Sketch"

const App = () => (
  <Canvas>
    <OrbitControls />
    <Sketch />
  </Canvas>
)

export default App
