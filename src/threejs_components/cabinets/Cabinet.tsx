import { useTexture } from '@react-three/drei'
function WoodMaterial() {
  const woodTexture = useTexture({
    normalMap: './Wood/Wood005_2K_NormalGL.jpg',
    roughnessMap: './Wood/Wood005_2K_Roughness.png',
    map: './Wood/Wood005_2K_Color.jpg'
  })
  return <meshStandardMaterial {...woodTexture} />
}
function LeatherMaterial({ color }: { color: string }) {
  const leatherTexture = useTexture({
    normalMap: './FabricLeather/FabricLeatherBuffaloRustic001_NRM_1K.jpg',
    roughnessMap: './FabricLeather/FabricLeatherBuffaloRustic001_roughness_1K.jpg',
    map: './FabricLeather/FabricLeatherBuffaloRustic001_COL_VAR1_1K_mono_my.jpg'
  })

  return <meshStandardMaterial
    {...leatherTexture}
    color={color}
    metalness={0}
    roughness={0.7}
  />
}
function FabricMaterial({ color }: { color: string }) {
  const fabricTexture = useTexture({
    normalMap: './FabricPlain/FabricPlainGreyFlat015_NRM_1K.png',
    map: './FabricPlain/FabricPlainGreyFlat015_COL_1K.jpg',
  })

  return <meshStandardMaterial
    {...fabricTexture}
    color={color}
    metalness={0}
    roughness={0.9}
  />
}
function UnitObject(props: any) {
  return (
    <>
      {/* left */}
      <mesh position={props.position} castShadow>
        <boxGeometry args={[1, 0.98, 0.02]} />
      </mesh>

      {/* right */}
      <mesh position={[props.position[0], props.position[1], props.position[2] - props.depth]} castShadow>
        <boxGeometry args={[1, 0.98, 0.02]} />
      </mesh>

      {/* bottom */}
      <mesh position={[props.position[0], props.position[1] - 0.5, props.position[2] - 0.5 - (props.depth - 1) / 2]} castShadow>
        <boxGeometry args={[1, 0.02, props.depth - 0.02]} />
      </mesh>

      {/* top */}
      <mesh position={[props.position[0], props.position[1] + 0.5, props.position[2] - 0.5 - (props.depth - 1) / 2]} castShadow>
        <boxGeometry args={[1, 0.02, props.depth + 0.02]} />
      </mesh>

      {/* back */}
      <mesh position={[props.position[0] - 0.45, props.position[1], props.position[2] - 0.5 - (props.depth - 1) / 2]} castShadow>
        <boxGeometry args={[0.02, 1, props.depth]} />
      </mesh>
    </>
  )
}
function MetalMaterial() {
  return <meshStandardMaterial
    color={'white'}
    roughness={0.3}
    metalness={1}
  />
}
export function Cabinet1(props: any) {
  const matrix: [] = props?.matrix;
  return (
    <>
      <group {...props} dispose={null} position={[3, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {
          matrix?.map((ele, index) => (
            new Array(ele).fill(0).map((value, i) => (
              <UnitObject position={[0, 0.5 + index, -i * Math.max(...matrix) / ele]} depth={Math.max(...matrix) / ele} key={i} />
            )))
          )
        }
      </group>
    </>
  )
}
