import React, { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Clone, Grid, Sphere, SpotLight, Edges, Html, Hud, OrthographicCamera } from "@react-three/drei";
import { EffectComposer, Vignette, SMAA, Bloom, DepthOfField, HueSaturation } from "@react-three/postprocessing";
import { Leva, useControls, folder } from "leva";
import { Color } from "three";
import { FlowFieldParticles } from "./components/FlowFieldParticles";
const World = () => {
  const { nodes: node } = useGLTF("title.glb");
  const { title } = node;

  const { nodes: node1 } = useGLTF("model.glb");
  const { Suzanne: mesh1 } = node1;

  const { nodes: node2 } = useGLTF("model2.glb");
  const { pug: mesh2 } = node2;

  const { nodes: node3 } = useGLTF("model3.glb");
  const { gorilla: mesh3 } = node3;

  const lightSourceRef = useRef();
  const cameraRef = useRef();

  const {
    lightSource,
    lightSourceColor,
    lightSourceIntensity,
    suzanne_position,
    suzanne_light,
    suzanne_interactive,
    suzanne_child_mesh_visible,
    suzanne_size,
    suzanne_intensity,
    suzanne_color_1,
    suzanne_color_2,
    suzanne_shape,
    suzanne_debug,
    gorilla_position,
    gorilla_light,
    gorilla_interactive,
    gorilla_child_mesh_visible,
    gorilla_size,
    gorilla_intensity,
    gorilla_color_1,
    gorilla_color_2,
    gorilla_shape,
    gorilla_debug,
    pug_position,
    pug_light,
    pug_interactive,
    pug_child_mesh_visible,
    pug_size,
    pug_intensity,
    pug_shape,
    pug_debug,
  } = useControls({
    Light: folder(
      {
        lightSource: { label: "Position", value: [-3.5, 3.5, 1.5], step: 0.1 },
        lightSourceColor: { label: "Color", value: "#ffd1c9" },
        lightSourceIntensity: { label: "Intensity", value: 1.6, min: 0, max: 2, step: 0.1 },
      },
      { collapsed: true }
    ),
    Suzanne: folder(
      {
        suzanne_position: { label: "Position", value: [-3, 1.2, 0], step: 0.1 },
        suzanne_light: { label: "Attach Light", value: true },
        suzanne_interactive: { label: "Interact with mouse", value: true },
        suzanne_child_mesh_visible: { label: "Display Child Mesh", value: true },
        suzanne_size: { label: "Particles Size", value: 1.0, min: 0.1, max: 6 },
        suzanne_intensity: { label: "Particles Disturb", value: 0.8, min: 0, max: 1 },
        suzanne_color_1: { label: "Particles Color 1", value: "#e3b300" },
        suzanne_color_2: { label: "ParticlesColor 2", value: "#fc7a42" },
        suzanne_shape: { label: "Particles Shape", value: "ring", options: ["disc", "ring", "sphere", "square"] },
        suzanne_debug: { label: "Debug", value: true },
      },
      { collapsed: true }
    ),
    Gorilla: folder(
      {
        gorilla_position: { label: "Position", value: [0, 0, -2], step: 0.1 },
        gorilla_light: { label: "Attach Light", value: true },
        gorilla_interactive: { label: "Interact with mouse", value: true },
        gorilla_child_mesh_visible: { label: "Display Child Mesh", value: false },
        gorilla_size: { label: "Particles Size", value: 1.8, min: 0.1, max: 8 },
        gorilla_intensity: { label: "Particles Disturb", value: 0.8, min: 0, max: 1 },
        gorilla_color_1: { label: "Particles Color 1", value: "#0d2eff" },
        gorilla_color_2: { label: "ParticlesColor 2", value: "#30b9ff" },
        gorilla_shape: { label: "Particles Shape", value: "sphere", options: ["disc", "ring", "sphere", "square"] },
        //gorilla_debug: { label: "Debug", value: false },
      },
      { collapsed: true }
    ),
    Pug: folder(
      {
        pug_position: { label: "Position", value: [2.5, 0, 0], step: 0.1 },
        pug_light: { label: "Attach Light", value: true },
        pug_interactive: { label: "Interact with mouse", value: true },
        pug_child_mesh_visible: { label: "Display Child Mesh", value: false },
        pug_size: { label: "Particles Size", value: 0.75, min: 0.1, max: 3 },
        pug_intensity: { label: "Particles Disturb", value: 0.8, min: 0, max: 1 },
        pug_shape: { label: "Particles Shape", value: "square", options: ["disc", "ring", "sphere", "square"] },
        //pug_debug: { label: "Debug", value: false },
      },
      { collapsed: true }
    ),
  });
  const scene = useThree(state => state.scene);
  useEffect(() => {
    scene.background = new Color("#123456");
    if (cameraRef.current) {
      cameraRef.current.object.position.set(-2, 2, 5);
      cameraRef.current.target.set(-0.5, 2, 0);
      cameraRef.current.update();
    }
  }, [scene]);

  return (
    <>
      <FlowFieldParticles
        name='Suzanne'
        debug={suzanne_debug}
        interactive={suzanne_interactive}
        childMeshVisible={suzanne_child_mesh_visible}
        size={suzanne_size}
        colors={[suzanne_color_1, suzanne_color_2]}
        disturbIntensity={suzanne_intensity}
        shape={suzanne_shape}
        lightSource={suzanne_light ? lightSourceRef : null}
      >
        <mesh position={suzanne_position} geometry={mesh1.geometry} material={mesh1.material} />
      </FlowFieldParticles>
      <FlowFieldParticles
        name='Gorilla'
        debug={gorilla_debug}
        interactive={gorilla_interactive}
        childMeshVisible={gorilla_child_mesh_visible}
        size={gorilla_size / 6}
        colors={[gorilla_color_1, gorilla_color_2]}
        disturbIntensity={gorilla_intensity}
        shape={gorilla_shape}
        lightSource={gorilla_light ? lightSourceRef : null}
      >
        <mesh position={gorilla_position} geometry={mesh3.geometry} material={mesh3.material} />
      </FlowFieldParticles>
      <FlowFieldParticles
        name='Pug'
        debug={pug_debug}
        interactive={pug_interactive}
        childMeshVisible={pug_child_mesh_visible}
        size={pug_size}
        disturbIntensity={pug_intensity}
        shape={pug_shape}
        lightSource={pug_light ? lightSourceRef : null}
      >
        <Clone object={mesh2} position={pug_position} />
      </FlowFieldParticles>
      <FlowFieldParticles name='Cube' size={0.3}>
        <mesh position={[0, 0.5, -1.1]}>
          <boxGeometry args={[1, 1, 1, 30, 30, 30]} />
          <meshBasicMaterial color='#f3a000' />
        </mesh>
      </FlowFieldParticles>
      <mesh geometry={title.geometry} scale={7} position={[0, 12, -20]}>
        <meshBasicMaterial color={"#f3a000"} transparent opacity={0.2} />
        <Edges lineWidth={0.45} color={"#fff"} />
      </mesh>
      <SpotLight
        ref={lightSourceRef}
        position={lightSource}
        intensity={lightSourceIntensity}
        angle={0.2}
        volumetric={false}
        distance={180}
        radiusBottom={120}
        color={lightSourceColor}
      />
      <Sphere args={[0.1]} position={lightSource}>
        <meshBasicMaterial color={lightSourceColor} />
      </Sphere>
      <Grid
        visible={true}
        cellSize={0.0}
        sectionSize={0.2}
        cellThickness={2}
        cellColor={"black"}
        sectionColor={"#f3a000"}
        followCamera={false}
        fadeDistance={30}
        fadeStrength={5}
        infiniteGrid
      />
      <OrbitControls ref={cameraRef} />
      <EffectComposer>
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
        <SMAA />
        <HueSaturation hue={0} saturation={0.12} />
        <Bloom luminanceThreshold={0.4} mipmapBlur luminanceSmoothing={0.25} intensity={5} radius={0.8} height={400} />
      </EffectComposer>
    </>
  );
};

const App = () => {
  return (
    <>
      <Canvas gl={{ antialias: false, powerPreference: "high-performance", stencil: false, depth: false }}>
        <World />
      </Canvas>
      <div style={{ position: "fixed", bottom: "0px", right: "0px", padding: "25px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems:'center' }}>
          <p style={{ color: "white" }}>Sébastien Lempens</p>
          <p style={{transform:'scale(0.85) translateY(4px)'}}>
            <a href='https://www.sebastien-lempens.com' title='https://www.sebastien-lempens.com' target="_blank">
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='white'
                stroke-width='1'
                stroke-linecap='round'
                stroke-linejoin='round'
                class='lucide lucide-globe'
              >
                <circle cx='12' cy='12' r='10' />
                <path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' />
                <path d='M2 12h20' />
              </svg>
            </a>
          </p>
          <p style={{transform:'scale(0.85) translateY(4px)'}}>
            <a href='https://x.com/s_lempens' target='_blank' title='https://x.com/s_lempens'>
              <svg xmlns='http://www.w3.org/2000/svg' width='20px' height='20px' viewBox='0 0 24 24' fill='white'>
                <path d='M14.095479,10.316482L22.286354,1h-1.940718l-7.115352,8.087682L7.551414,1H1l8.589488,12.231093L1,23h1.940717  l7.509372-8.542861L16.448587,23H23L14.095479,10.316482z M11.436522,13.338465l-0.871624-1.218704l-6.924311-9.68815h2.981339  l5.58978,7.82155l0.867949,1.218704l7.26506,10.166271h-2.981339L11.436522,13.338465z' />
              </svg>
            </a>
          </p>
        </div>
      </div>
      <Leva flat oneLineLabels collapsed={false} />
    </>
  );
};

export default App;
