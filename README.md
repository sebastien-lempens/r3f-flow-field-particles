# R3F FLOW FIELD PARTICLES COMPONENT
#### by Sebastien Lempens

<a href="https://x.com/s_lempens" target="_blank">
    <img src="https://img.shields.io/twitter/follow/s_lempens?style=for-the-badge&logo=x" alt="Chat on Twitter">
</a>

<div style="margin:25px 0">
 <a style="font-size:larger; font-weight:bold" href="https://r3f-flow-field-particles.vercel.app" target="_blank"><img src="https://raw.githubusercontent.com/sebastien-lempens/r3f-flow-field-particles/refs/heads/main/public/screenshot.jpg" /></a>
</div>

<p style="margin:25px 0">
  <a style="font-size:larger; font-weight:bold" href="https://r3f-flow-field-particles.vercel.app" target="_blank">VIEW DEMO</a>
</p>

## Overview
The `FlowFieldParticles` component is a customizable React component built with React Three Fiber. It renders an animated particle system that simulates particle flow using a GPU computation renderer. This component is ideal for creating dynamic, interactive, and optimized particle effects that respond to mouse movement.

## Features
- Customizable particle shapes (disc, ring, sphere, square).
- Dynamic particle color and size control.
- Real-time interaction with mouse movement for particle repulsion.
- Supports light source for realistic lighting and shading.
- Ability to use an external mesh as the base model for particles.

## Installation
Ensure you have the following packages installed in your project:
```bash
npm install three @react-three/fiber
```
Then [download](https://gist.github.com/sebastien-lempens/f9318c430500e4ac9b7160a0322db4d6) the JSX component and integrate it into your project (e.g. /components/FlowFieldParticles.jsx). 

## Usage
Here's an example of how to use the `FlowFieldParticles` component in your R3F project:
<details>
  <summary>SHOW BASIC IMPLEMENTATION</summary>

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { FlowFieldParticles } from './components/FlowFieldParticles';

function App() {
  return (
    <Canvas>
      <FlowFieldParticles>
        <mesh position={[1,0,-1]}>
          <boxGeometry args={[1, 1, 1, 10, 10, 10]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </FlowFieldParticles>
    </Canvas>
  );
}
export default App;
```

</details>

## Props
| Prop              | Type     | Default   | Value(s)                                  | Description |
|-------------------|----------|-----------|-------------------------------------------|-------------|
| `debug`            | bool   | `false`     |                                          | Debugging information (visual helpers, console.log outputs...) |
| `size`            | Number   | `0.1`     | Any positive number                       | Base size of the particles. |
| `interactive`     | Boolean  | `true`    |                                           | Enables mouse interaction |
| `childMeshVisible`     | Boolean  | `false`    |                                           | Display the child Mesh |
| `colors`          | Array    | `null`    | Array of hex color codes [string \| Color ]                | Array of 2 colors hex codes for particle gradients. If this property is omitted, then the texture of the mesh will be considered. |
| `disturbIntensity`| Number   | `0.3`     | Between `0` and `1`                       | Intensity of particle disturbance and flow. |
| `shape`           | String   | `"disc"`  | `"disc"`, `"ring"`, `"sphere"`, `"square"`| Shape of particle |
| `lightSource`     | React.RefObject   | `null`    | A React useRef reference | Light source |
| `children`     | React.Children   |    | A mandatory mesh object | Threejs \<mesh /> or Drei \<Clone /> component |

## Caveat
~~The component, for now, needs to be outside of any component with a defined position (otherwise, there will be an offset with the mouse positioning). If you want to reposition the particle component, you must assign the same position to the child mesh of the component.~~ <br>Fixed :)


## ToDo List

- [ ] Dynamic recalculation of lighting on a non-static mesh
- [ ] Dynamic transition particles between 2 meshes
- [ ] Multiple light reference sources
- [ ] Typescript version
- [ ] Various improvements...

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
