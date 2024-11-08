import React, { useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Clone,
  Environment,
  Grid,
} from "@react-three/drei";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { Leva, useControls, folder } from "leva";
import { FlowFieldParticles } from "./components/FlowFieldParticles";
const World = () => {
  const { nodes: node1 } = useGLTF("model.glb");
  const { Suzanne: mesh1 } = node1;

  const { nodes: node2 } = useGLTF("model2.glb");
  const { pug: mesh2 } = node2;

  const { nodes: node3 } = useGLTF("model3.glb");
  const { gorilla: mesh3 } = node3;

  const {
    suzanne_size,
    suzanne_intensity,
    suzanne_color_1,
    suzanne_color_2,
    suzanne_shade_color,
    gorilla_size,
    gorilla_intensity,
    gorilla_color_1,
    gorilla_color_2,
    gorilla_shade_color,
    pug_size,
    pug_intensity,
  } = useControls({
    Suzanne: folder({
      suzanne_size: { label: "Size", value: 0.45, min: 0.1, max: 3 },
      suzanne_intensity: { label: "Disturb Intensity", value: 0.5, min: 0, max: 1 },
      suzanne_color_1: { label: "Color 1", value: "#e35500" },
      suzanne_color_2: { label: "Color 2", value: "#42cbfc" },
      suzanne_shade_color: { label: "Shade Color", value: true },
    }),
    Gorilla: folder({
      gorilla_size: { label: "Size", value: 1, min: 0.1, max: 3 },
      gorilla_intensity: { label: "Disturb Intensity", value: 0.5, min: 0, max: 1 },
      gorilla_color_1: { label: "Color 1", value: "#ff710d" },
      gorilla_color_2: { label: "Color 2", value: "#ff0000" },
      gorilla_shade_color: { label: "Shade Color", value: false },
    }),
    Pug: folder({
      pug_size: { label: "Size", value: 0.22, min: 0.1, max: 3 },
      pug_intensity: { label: "Disturb Intensity", value: 0.5, min: 0, max: 1 },
    }),
  });
  return (
    <>
      <FlowFieldParticles
        size={suzanne_size}
        colors={[suzanne_color_1, suzanne_color_2]}
        shadeColor={suzanne_shade_color}
        disturbIntensity={suzanne_intensity}
      >
        <mesh position={[-3, 1.2, 0]} geometry={mesh1.geometry} material={mesh1.material} />
      </FlowFieldParticles>
      <FlowFieldParticles
        size={gorilla_size / 6}
        colors={[gorilla_color_1, gorilla_color_2]}
        shadeColor={gorilla_shade_color}
        disturbIntensity={gorilla_intensity}
      >
        <mesh position={[0, 0, -2]} geometry={mesh3.geometry} material={mesh3.material} />
      </FlowFieldParticles>

      <FlowFieldParticles size={pug_size} disturbIntensity={pug_intensity}>
        <Clone object={mesh2} position={[2.5, 0, 0]} />
      </FlowFieldParticles>

      <Grid visible={true} cellSize={0.2} sectionSize={0.3} cellThickness={1} cellColor={'black'} sectionColor={'rgba(255,255,255,0.2)'} followCamera fadeDistance={30} fadeStrength={5} infiniteGrid args={[20, 20]} />
      <EffectComposer>
        <DepthOfField focusDistance={0.01} focalLength={0.05} bokehScale={2} height={480} />
        <Bloom luminanceThreshold={0.0} luminanceSmoothing={0.9} radius={0.2} height={300} mipmapBlur />
        {/* <Noise opacity={0.02} />
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
