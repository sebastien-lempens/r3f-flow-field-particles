import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Clone, Environment, Grid, Sphere, SpotLight } from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Leva, useControls, folder } from "leva";
import { Color } from "three";
import { FlowFieldParticles } from "./components/FlowFieldParticles";
const World = () => {
  const { nodes: node1 } = useGLTF("model.glb");
  const { Suzanne: mesh1 } = node1;

  const { nodes: node2 } = useGLTF("model2.glb");
  const { pug: mesh2 } = node2;

  const { nodes: node3 } = useGLTF("model3.glb");
  const { gorilla: mesh3 } = node3;

  const lightSourceRef = useRef();

  const {
    lightSource,
    lightSourceColor,
    suzanne_size,
    suzanne_intensity,
    suzanne_color_1,
    suzanne_color_2,
    suzanne_shape,
    gorilla_size,
    gorilla_intensity,
    gorilla_color_1,
    gorilla_color_2,
    gorilla_shape,
    pug_size,
    pug_intensity,
    pug_shape,
  } = useControls({
    lightSource: { label: "Light Source", value: [0.2, 3.8, 0.5], step: 0.1 },
    lightSourceColor: { label: "Light Source Color", value: "#ff0000" },
    Suzanne: folder({
      suzanne_size: { label: "Size", value: 1.0, min: 0.1, max: 6 },
      suzanne_intensity: { label: "Disturb Intensity", value: 0.5, min: 0, max: 1 },
      suzanne_color_1: { label: "Color 1", value: "#e35500" },
      suzanne_color_2: { label: "Color 2", value: "#42cbfc" },
      suzanne_shape: { label: "Shape", value: "ring", options: ["disc", "ring", "sphere", "square"] },
    }),
    Gorilla: folder({
      gorilla_size: { label: "Size", value: 5, min: 0.1, max: 8 },
      gorilla_intensity: { label: "Disturb Intensity", value: 0.5, min: 0, max: 1 },
      gorilla_color_1: { label: "Color 1", value: "#0d2eff" },
      gorilla_color_2: { label: "Color 2", value: "#30b9ff" },
      gorilla_shape: { label: "Shape", value: "sphere", options: ["disc", "ring", "sphere", "square"] },
    }),
    Pug: folder({
      pug_size: { label: "Size", value: 0.75, min: 0.1, max: 3 },
      pug_intensity: { label: "Disturb Intensity", value: 0.5, min: 0, max: 1 },
      pug_shape: { label: "Shape", value: "square", options: ["disc", "ring", "sphere", "square"] },
    }),
  });
  const scene = useThree(state => state.scene);
  useEffect(() => {
    scene.background = new Color("#123456");
  }, [scene]);

  return (
    <>
      <FlowFieldParticles
        name='Suzanne'
        size={suzanne_size}
        colors={[suzanne_color_1, suzanne_color_2]}
        disturbIntensity={suzanne_intensity}
        shape={suzanne_shape}
        lightSource={lightSourceRef}
      >
        <mesh position={[-3, 1.2, 0]} geometry={mesh1.geometry} material={mesh1.material} />
      </FlowFieldParticles>
      <FlowFieldParticles
        name='Gorilla'
        size={gorilla_size / 6}
        colors={[gorilla_color_1, gorilla_color_2]}
        disturbIntensity={gorilla_intensity}
        shape={gorilla_shape}
        lightSource={lightSourceRef}
      >
        <mesh position={[0, 0, -2]} geometry={mesh3.geometry} material={mesh3.material} />
      </FlowFieldParticles>

      <FlowFieldParticles name='Pug' size={pug_size} disturbIntensity={pug_intensity} shape={pug_shape} lightSource={lightSourceRef}>
        <Clone object={mesh2} position={[2.5, 0, 0]} />
      </FlowFieldParticles>

      {/* <SpotLight ref={lightSourceRef} position={lightSource} intensity={1} angle={0.3} penumbra={0.5} color={lightSourceColor} /> */}
      <pointLight ref={lightSourceRef} position={lightSource} intensity={0.5} color={lightSourceColor} />

      <Sphere args={[0.2]} position={lightSource}>
        <meshBasicMaterial color={lightSourceColor} />
      </Sphere>

      <Grid
        visible={true}
        cellSize={0.2}
        sectionSize={0.3}
        cellThickness={1}
        cellColor={"black"}
        sectionColor={"#6db6d9"}
        followCamera
        fadeDistance={30}
        fadeStrength={5}
        infiniteGrid
        args={[20, 20]}
      />
      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} radius={0.8} height={300} mipmapBlur />
        {/* 
        <Noise opacity={0.02} />
         <DepthOfField focusDistance={0.01} focalLength={0.05} bokehScale={2} height={480} />
         */}
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
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
