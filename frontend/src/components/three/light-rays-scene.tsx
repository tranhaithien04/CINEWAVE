"use client";

import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type LightRaysSceneProps = {
  lowPower?: boolean;
};

function createRayTexture() {
  const width = 64;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const image = ctx.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const fadeY = 1 - y / height;
    for (let x = 0; x < width; x += 1) {
      const nx = (x / (width - 1) - 0.5) * 2;
      const fadeX = Math.exp(-nx * nx * 4.4);
      const alpha = fadeX * fadeY;
      const i = (y * width + x) * 4;
      image.data[i] = 103;
      image.data[i + 1] = 232;
      image.data[i + 2] = 249;
      image.data[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function LightRays({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const { geometry, material, texture } = useMemo(() => {
    const texture = createRayTexture();
    return {
      texture,
      geometry: new THREE.PlaneGeometry(1.15, 18),
      material: new THREE.MeshBasicMaterial({
        map: texture,
        color: "#c4b5fd",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    };
  }, []);

  const poses = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const t = count === 1 ? 0 : index / (count - 1);
        return {
          rotationZ: (t - 0.5) * 1.15,
          scaleX: 0.28 + (index % 2) * 0.1,
        };
      }),
    [count],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [geometry, material, texture]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.rotation.z = Math.sin(t * 0.12) * 0.08;
    group.position.y = 1.6 + Math.sin(t * 0.18) * 0.08;
  });

  return (
    <group ref={groupRef} position={[0.2, 1.6, -2.4]} rotation={[0.08, 0, 0]}>
      {poses.map((pose) => (
        <mesh
          key={pose.rotationZ}
          geometry={geometry}
          material={material}
          position={[0, -4.2, 0]}
          rotation={[0, 0, pose.rotationZ]}
          scale={[pose.scaleX, 1, 1]}
        />
      ))}
    </group>
  );
}

function RayCore() {
  return (
    <Float speed={0.35} rotationIntensity={0.04} floatIntensity={0.14}>
      <mesh position={[0.15, 2.35, -2.1]}>
        <sphereGeometry args={[0.42, 12, 12]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>
    </Float>
  );
}

export function LightRaysScene({ lowPower = false }: LightRaysSceneProps) {
  // Fake god-rays: vài plane additive, 1 geo + 1 mat. Không volumetric, không particle.
  const rayCount = lowPower ? 4 : 6;

  return (
    <>
      <color attach="background" args={["#06070d"]} />
      <fog attach="fog" args={["#06070d", 16, 40]} />
      <ambientLight intensity={0.12} color="#164e63" />
      <LightRays count={rayCount} />
      <RayCore />
    </>
  );
}
