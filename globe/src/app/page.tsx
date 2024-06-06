"use client";

import * as THREE from "three";
import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as d3 from "d3"; // Import d3 for CSV parsing

export default function Home() {
  const [imageData, setImageData] = useState<Uint8ClampedArray | null>(null);
  const [colorMap, setColorMap] = useState<Record<number, string>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load image and CSV data
  useEffect(() => {
    const img = new window.Image();
    img.src = "/world_map_shades_of_green.png"; // Adjust the path accordingly
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

    // Load CSV data
    d3.csv("/country_green_shades.csv").then((data) => {
      const colorMapping: Record<number, string> = {};
      data.forEach((row) => {
        const green = parseInt(row["Green Channel Value"]);
        const country = row["Country Name"];
        colorMapping[green] = country;
      });
      setColorMap(colorMapping);
    });
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
    if (!imageData) return null; // Ensure image data is loaded
    const canvas = canvasRef.current;
    if (!canvas) return null; // Ensure canvas is not null
    const { x, y } = coordinateToPixel(long, lat, canvas.width, canvas.height);
    const index = (y * canvas.width + x) * 4; // Each pixel has 4 values (RGBA)

    const r = imageData[index];
    const g = imageData[index + 1];
    const b = imageData[index + 2];
    const brightness = (r + g + b) / 3;

    // Check if the color is not white and return the country name
    if (g in colorMap) {
      return { country: colorMap[g], color: `rgb(${r}, ${g}, ${b})` };
    }
    return null;
  };

  const Circles = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const step = 0.6;
    const circle_radius = 2.03;
    const [count, positions, colors] = useMemo(() => {
      const positions: number[] = [];
      const colors: number[] = [];
      let count = 0;
      for (let lat = -90; lat <= 90; lat += step) {
        for (let lon = -180; lon <= 180; lon += step) {
          const result = visibilityForCoordinate(lon, lat);
          if (result) {
            const { color } = result;
            const [r, g, b] = color.match(/\d+/g)!.map(Number);
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(circle_radius * Math.sin(phi) * Math.cos(theta));
            const y = circle_radius * Math.cos(phi);
            const z = circle_radius * Math.sin(phi) * Math.sin(theta);
            positions.push(x, y, z);
            colors.push(r / 255, g / 255, b / 255);
            count++;
          }
        }
      }
      return [count, new Float32Array(positions), new Float32Array(colors)];
    }, [imageData, colorMap]);

    useEffect(() => {
      if (meshRef.current) {
        const dummy = new THREE.Object3D();
        const up = new THREE.Vector3(0, 0, 1);
        for (let i = 0; i < count; i++) {
          dummy.position.set(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          );

          const normal = new THREE.Vector3(
            positions[i * 3],
            positions[i * 3 + 1],
            positions[i * 3 + 2]
          ).normalize();

          const quaternion = new THREE.Quaternion().setFromUnitVectors(
            up,
            normal
          );
          dummy.quaternion.copy(quaternion);

          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        // Set instance colors
        const colorArray = new Float32Array(colors.length);
        colors.forEach((color, index) => {
          colorArray[index] = color;
        });
        meshRef.current.geometry.setAttribute(
          "color",
          new THREE.InstancedBufferAttribute(colorArray, 3)
        );
      }
    }, [count, positions, colors]);

    return (
      <instancedMesh
        ref={meshRef}
        args={[
          new THREE.SphereGeometry(0.01, 5, 5),
          new THREE.MeshBasicMaterial({ vertexColors: true }),
          count,
        ]}
      />
    );
  };

  const RotatingGroup = () => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame(() => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.005;
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