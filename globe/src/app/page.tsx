"use client";

import * as THREE from "three";
import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function Home() {
  const [imageData, setImageData] = useState<Uint8ClampedArray | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/map_test.png"; // Adjust the path accordingly
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return; // Ensure canvas is not null
      const context = canvas.getContext("2d");
      if (!context) return; // Ensure context is not null
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      setImageData(data);
    };
  }, []);

  const coordinateToPixel = (
    long: number,
    lat: number,
    imageWidth: number,
    imageHeight: number
  ) => {
    const x = Math.floor((long + 180) * (imageWidth / 360));
    const y = Math.floor((90 - lat) * (imageHeight / 180));
    return { x, y };
  };

  const visibilityForCoordinate = (long: number, lat: number) => {
    if (!imageData) return false; // Ensure image data is loaded
    const canvas = canvasRef.current;
    if (!canvas) return false; // Ensure canvas is not null
    const { x, y } = coordinateToPixel(long, lat, canvas.width, canvas.height);
    const index = (y * canvas.width + x) * 4; // Each pixel has 4 values (RGBA)

    // Calculate the brightness as the average of the R, G, and B values
    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    const brightness = (r + g + b) / 3; // Average brightness

    const landBrightnessThreshold = 200; // Define your threshold for land (0 = black, 255 = white)

    return brightness < landBrightnessThreshold;
  };

  const Circles = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const step = 0.6;
    const circle_radius = 2.03
    const [count, positions] = useMemo(() => {
      const positions: number[] = [];
      let count = 0;
      for (let lat = -90; lat <= 90; lat += step) {
        // Adjust the step for desired resolution
        for (let lon = -180; lon <= 180; lon += step) {
          // Adjust the step for desired resolution
          if (visibilityForCoordinate(lon, lat)) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(circle_radius * Math.sin(phi) * Math.cos(theta)); // 2 is the radius of the sphere
            const y = circle_radius * Math.cos(phi);
            const z = circle_radius * Math.sin(phi) * Math.sin(theta);
            positions.push(x, y, z);
            count++;
          }
        }
      }
      return [count, new Float32Array(positions)];
    }, [imageData]);

    useEffect(() => {
      if (meshRef.current) {
        const dummy = new THREE.Object3D();
        const up = new THREE.Vector3(0, 0, 1); // Adjusted the 'up' vector
        for (let i = 0; i < count; i++) {
          dummy.position.set(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          );

          // Calculate the normal vector
          const normal = new THREE.Vector3(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          ).normalize();

          // Create a quaternion that rotates from the up vector to the normal
          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            up,
            normal
          );
          dummy.quaternion.copy(quaternion);

          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }, [count, positions]);

    return (
      <instancedMesh
        ref={meshRef}
        args={[
          // new THREE.CircleGeometry(0.007, 16),
          new THREE.SphereGeometry(0.01,5, 5),
          new THREE.MeshBasicMaterial({ color: "green" }),
          count,
        ]}
      />
    );
  };

  const RotatingGroup = () => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame(() => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.001; // Adjust the speed of rotation here
      }
    });

    return (
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[2, 100, 100]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Circles />
      </group>
    );
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ width: "100vw", height: "100vh" }}>
        <Canvas style={{ width: "100%", height: "100%" }}>
          <ambientLight intensity={Math.PI / 2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            decay={0}
            intensity={Math.PI}
          />
          <pointLight
            position={[-10, -10, -10]}
            decay={0}
            intensity={Math.PI}
          />
          <RotatingGroup />
        </Canvas>
      </div>
    </>
  );
}
