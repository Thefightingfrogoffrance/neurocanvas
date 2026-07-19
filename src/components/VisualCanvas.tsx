import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEmotionStore } from '../state/emotionStore';
import * as THREE from 'three';
import { mapEmotionToVisualParams } from '../engines/visualEngine';

function ReactiveParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = 400;

  useFrame((state) => {
    const { valence, arousal } = useEmotionStore.getState();
    const { hue, motionSpeed } = mapEmotionToVisualParams(valence, arousal);
    const speed = motionSpeed * 1.5;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const t = state.clock.elapsedTime * speed + i;
      dummy.position.set(
        Math.sin(t + i) * 3,
        Math.cos(t * 1.3 + i) * 3,
        Math.sin(t * 0.7) * 3
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.color.setHSL(hue / 360, 0.6, 0.55);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

export default function VisualCanvas({ canvasRef }: { canvasRef?: React.MutableRefObject<HTMLCanvasElement | null> }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8] }}
      onCreated={({ gl }) => {
        if (canvasRef) canvasRef.current = gl.domElement;
      }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} />
      <ReactiveParticles />
    </Canvas>
  );
}
