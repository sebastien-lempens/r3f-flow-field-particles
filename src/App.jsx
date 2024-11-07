import React, { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Clone,
  Wireframe,
  Edges,
  MeshDiscardMaterial,
  Outlines,
  Stage,
  Backdrop,
  ContactShadows,
  Environment,
} from "@react-three/drei";
import { Leva, useControls, folder } from "leva";
import { FlowFieldParticles } from "./components/FlowFieldParticles";
const World = () => {
  const { nodes } = useGLTF("model2.glb");
  const { pug: mesh } = nodes;
  const { size, chaosIntensity } = useControls({
    size: {
      value: 0.5,
      step: 0.1,
      min: 0,
      max: 2,
    },
    chaosIntensity: {
      value: 0.5,
      step: 0.1,
      min: 0,
      max: 1,
    },
  });
  return (
    <>
      <FlowFieldParticles size={size} chaosIntensity={chaosIntensity} position={[0, 0, 0]} scale={1}>
        <Clone object={mesh} />
      </FlowFieldParticles>

      {/* <Clone object={mesh} scale={0.25}></Clone> */}
      <Environment preset='apartment' ground={{ scale: 5, height: 4, radius: 25 }} background resolution={1024 * 2} />
      <ambientLight intensity={1.0} />
    </>
  );
};

const App = () => {
  return (
    <>
      <Canvas>
        <OrbitControls />
        <World />
      </Canvas>
      <Leva flat oneLineLabels collapsed={false} />
    </>
  );
};

export default App;
