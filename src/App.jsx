import React, { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {  OrbitControls, useGLTF } from "@react-three/drei";
import { Leva, useControls, folder } from "leva";
import { FlowFieldParticles } from "./components/FlowFieldParticles";
const World = () => {
  const {nodes:{Suzanne}} = useGLTF('model.glb')
  return (
    <>
    <FlowFieldParticles model={Suzanne} colors={['#f3a000','#cf122b']} />
    <ambientLight />
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
