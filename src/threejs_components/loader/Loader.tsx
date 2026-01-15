import { Html } from "@react-three/drei"
import { useFrame } from '@react-three/fiber'
import { useRef } from "react"
import { useThree, } from "@react-three/fiber"
import "./style.css"
export function Loader({ isInitialLoading }: any) {
  //   const camera = useThree(state => state.camera)
  //   const meshRef = useRef<THREE.Group>(null!)
  //   useFrame(() => { meshRef.current.lookAt(camera.position) })
  return (
    // <group position={[0, 1, 0]} ref={meshRef} >
    //   <Html transform castShadow>
    //     <div className="custom-loader"></div>
    //   </Html>
    // </group>

    isInitialLoading &&
    <div className="scene">
      {/* <div className="cube-wrapper">
        <div className="cube">
          <div className="cube-faces">
            <div className="cube-face shadow"></div>
            <div className="cube-face bottom"></div>
            <div className="cube-face top"></div>
            <div className="cube-face left"></div>
            <div className="cube-face right"></div>
            <div className="cube-face back"></div>
            <div className="cube-face front"></div>
          </div>
        </div>
      </div> */}
      <img src="/gif/initialLoading.gif" style={{ height: "50vh" }} />
      {/* <div style={{ bottom: "30%" }}> */}
      {/* Loading... */}
      {/* </div> */}
    </div>
  )
}