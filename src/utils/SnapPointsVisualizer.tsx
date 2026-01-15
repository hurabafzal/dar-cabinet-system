import React, { useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { generateSnapPoints, SnapPoint } from './objectSnap';

interface SnapPointsVisualizerProps {
  selectedObjectUuid: string | null;
  objectWidth?: number;
  objectDepth?: number;
  visible?: boolean;
  activeObjectPositions?: Record<string, THREE.Vector3>;
}

export function SnapPointsVisualizer({
  selectedObjectUuid,
  objectWidth = 0.6,
  objectDepth = 0.4,
  visible = true,
  activeObjectPositions
}: SnapPointsVisualizerProps) {
  const [snapPoints, setSnapPoints] = useState<SnapPoint[]>([]);
  const [opacity, setOpacity] = useState(0.6);
  let renderCounter = 0;

  renderCounter++;
  console.log(`SnapPointsVisualizer Render #${renderCounter}`);
  // Aktualisiere Snap-Punkte, wenn sich Objekte ändern
  useEffect(() => {
    if (!visible || !activeObjectPositions) return;
    
    const allSnapPoints: SnapPoint[] = [];
    
    // Nur Snap-Punkte aus activeObjectPositions generieren
    Object.entries(activeObjectPositions).forEach(([uuid, position]) => {
      // Überspringe das ausgewählte Objekt
      if (uuid === selectedObjectUuid) return;
      
      // Generiere Snap-Punkte für dieses Objekt
      const objSnapPoints = generateSnapPoints(position, objectWidth, objectDepth);
      allSnapPoints.push(...objSnapPoints);
    });
    
    setSnapPoints(allSnapPoints);
  }, [activeObjectPositions, selectedObjectUuid, objectWidth, objectDepth, visible]);

  // Pulsationseffekt für alle Snap-Punkte
  useFrame(() => {
    // Leichte Pulsation für bessere Sichtbarkeit
    const pulse = 0.4 + Math.sin(Date.now() * 0.003) * 0.2;
    setOpacity(pulse);
  });

  // Keine Darstellung bei nicht sichtbaren Snap-Punkten
  if (!visible) return null;

  return (
    <group>
      {snapPoints.map((point, index) => (
        <mesh
          key={`snap-point-${index}`}
          position={point.position}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial
            color={point.color}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  );
}