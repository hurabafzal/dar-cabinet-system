import { useLoader } from "@react-three/fiber";
import * as THREE from 'three'
export function Ground() {
  // const texture = useLoader(THREE.TextureLoader, './texture/Floor/E040.jpg')//-
  // texture.wrapS = THREE.RepeatWrapping; // Repeat horizontally//-
  // texture.wrapT = THREE.RepeatWrapping; // Repeat vertically//-
  // texture.repeat.set(14, 14); // Adjust the repetition scale//-
  const [colorMap, normalMap, aoMap] = useLoader(THREE.TextureLoader, [
    './texture/Floor/E040.jpg',
    './texture/Floor/2145.jpg',
    // './texture/Floor/Wood005_2K_Roughness.png',
    './texture/Floor/FabricLeatherBuffaloRustic001_AO_1K.jpg'
  ]);

  const textures = [colorMap, normalMap, aoMap];
  textures.forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
  });

  return (
    <mesh rotation-x={-Math.PI * 0.5} castShadow receiveShadow position={[0, 0.01, -4]}>
      <planeGeometry args={[8.4, 10]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        // roughnessMap={roughnessMap}
        aoMap={aoMap}
        envMapIntensity={0.5}
        metalness={0.5}
        roughness={0.4}

      />
    </mesh>
  );
}