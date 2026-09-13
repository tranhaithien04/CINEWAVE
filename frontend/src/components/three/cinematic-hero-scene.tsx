"use client";

import { Float, Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type CinematicHeroSceneProps = {
  lowPower?: boolean;
};

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Drift rất chậm — cinematic, không orbit loạn
    state.camera.position.x = Math.sin(t * 0.11) * 0.32;
    state.camera.position.y = 0.15 + Math.cos(t * 0.08) * 0.16;
    state.camera.lookAt(0, 0, -2);
  });
  return null;
}

function DustField({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#e9d5ff",
        size: 0.032,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.y += delta * 0.018;
    points.rotation.x += delta * 0.006;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

function VioletOrbs() {
  return (
    <group>
      <Float speed={0.45} rotationIntensity={0.12} floatIntensity={0.35}>
        <mesh position={[-2.4, 0.35, -5]}>
          <sphereGeometry args={[1.55, 20, 20]} />
          <meshStandardMaterial
            color="#4c1d95"
            emissive="#6d28d9"
            emissiveIntensity={0.55}
            roughness={0.78}
            metalness={0.08}
          />
        </mesh>
      </Float>
      <Float speed={0.35} rotationIntensity={0.08} floatIntensity={0.28}>
        <mesh position={[3.1, -0.6, -6.2]}>
          <sphereGeometry args={[0.95, 18, 18]} />
          <meshStandardMaterial
            color="#5b21b6"
            emissive="#7c3aed"
            emissiveIntensity={0.4}
            roughness={0.82}
            metalness={0.05}
          />
        </mesh>
      </Float>
    </group>
  );
}

export function CinematicHeroScene({ lowPower = false }: CinematicHeroSceneProps) {
  // Mobile / 4-core: cắt particle. Stars của Drei dùng shader nhẹ hơn Points thường.
  const starCount = lowPower ? 320 : 780;
  const dustCount = lowPower ? 48 : 110;

  return (
    <>
      <color attach="background" args={["#030014"]} />
      <fog attach="fog" args={["#030014", 10, 36]} />

      {/* Tối đa 3 lights: ambient + 2 point violet */}
      <ambientLight intensity={0.16} color="#2e1065" />
      <pointLight position={[2.8, 3.4, 2]} color="#8b5cf6" intensity={10} distance={20} decay={2} />
      <pointLight position={[-4.5, -0.8, -2.5]} color="#4c1d95" intensity={5} distance={16} decay={2} />

      <Stars
        radius={58}
        depth={38}
        count={starCount}
        factor={3.4}
        saturation={0.28}
        fade
        speed={0.22}
      />
      <DustField count={dustCount} />
      <VioletOrbs />
      <CameraDrift />
    </>
  );
}
