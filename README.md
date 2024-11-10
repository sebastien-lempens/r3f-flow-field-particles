# R3F FLOW FIELD PARTICLES COMPONENT
#### by Sebastien Lempens

![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/s_lempens?style=for-the-badge)




## Overview
The `FlowFieldParticles` component is a customizable React component built with React Three Fiber and Drei. It renders an animated particle system that simulates particle flow using a GPU computation renderer. This component is ideal for creating dynamic and interactive particle effects that respond to mouse movement.

## Features
- Customizable particle shapes (disc, ring, sphere, square).
- Dynamic particle color and size control.
- Real-time interaction with mouse movement for particle repulsion.
- Supports light source for realistic lighting and shading.
- Ability to use an external mesh as the base model for particles.

## Installation
Ensure you have the following packages installed in your project:
```bash
npm install three @react-three/fiber @react-three/drei
```
Then [download](https://gist.github.com/sebastien-lempens/f9318c430500e4ac9b7160a0322db4d6) the JSX component and integrate it into your project. 

## Usage
Here's an example of how to use the `FlowFieldParticles` component in your React project:

```jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { FlowFieldParticles } from './FlowFieldParticles';

function App() {
  return (
    <Canvas>
      <FlowFieldParticles
        colors={["#FF0000", "#00FF00"]}
        size={0.2}
        disturbIntensity={0.4}
        shape="sphere"
      >
        {/* Base mesh child */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </FlowFieldParticles>
    </Canvas>
  );
}

export default App;
```

## Props
| Prop              | Type     | Default   | Value(s)                                  | Description |
|-------------------|----------|-----------|-------------------------------------------|-------------|
| `size`            | Number   | `0.1`     | Any positive number                       | Base size of the particles. |
| `colors`          | Array    | `null`    | Array of hex color codes                  | Array of 2 colors hex codes for particle gradients. If this property is omitted, then the texture of the mesh will be considered. |
| `disturbIntensity`| Number   | `0.3`     | Between `0` and `1`                       | Intensity of particle disturbance and flow. |
| `shape`           | String   | `"disc"`  | `"disc"`, `"ring"`, `"sphere"`, `"square"`| Shape of particle |
| `lightSource`     | React.RefObject   | `null`    | A React useRef reference | Light source |

## ToDo List

- [ ] Dynamic transition particles between 2 meshes

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
