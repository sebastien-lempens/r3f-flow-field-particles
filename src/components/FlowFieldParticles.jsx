import React, { useCallback, useEffect, useRef, useMemo, memo, useState, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BufferGeometry, BufferAttribute, Color, Uniform, Vector3, MathUtils } from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";

const GpgpuFragmentShader = /*glsl*/ `
  uniform float uTime;
  uniform float uDeltaTime;
  uniform vec3 uMouse;
  uniform float uMouseDelta;
  uniform float uDisturbIntensity;
  uniform float uRepulsionForce;
  uniform bool uInteractive;
  uniform sampler2D uBaseParticlesTexture;
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);} float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;} float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;} vec4 grad4(float j, vec4 ip){ const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0); vec4 p,s; p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0; p.w = 1.5 - dot(abs(p.xyz), ones.xyz); s = vec4(lessThan(p, vec4(0.0))); p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; return p; } float snoise(vec4 v){ const vec2  C = vec2( 0.138196601125010504, 0.309016994374947451); vec4 i  = floor(v + dot(v, C.yyyy) ); vec4 x0 = v -   i + dot(i, C.xxxx); vec4 i0; vec3 isX = step( x0.yzw, x0.xxx ); vec3 isYZ = step( x0.zww, x0.yyz ); i0.x = isX.x + isX.y + isX.z; i0.yzw = 1.0 - isX; i0.y += isYZ.x + isYZ.y; i0.zw += 1.0 - isYZ.xy; i0.z += isYZ.z; i0.w += 1.0 - isYZ.z; vec4 i3 = clamp( i0, 0.0, 1.0 ); vec4 i2 = clamp( i0-1.0, 0.0, 1.0 ); vec4 i1 = clamp( i0-2.0, 0.0, 1.0 ); vec4 x1 = x0 - i1 + 1.0 * C.xxxx; vec4 x2 = x0 - i2 + 2.0 * C.xxxx; vec4 x3 = x0 - i3 + 3.0 * C.xxxx; vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx; i = mod(i, 289.0); float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x); vec4 j1 = permute( permute( permute( permute ( i.w + vec4(i1.w, i2.w, i3.w, 1.0 )) + i.z + vec4(i1.z, i2.z, i3.z, 1.0 )) + i.y + vec4(i1.y, i2.y, i3.y, 1.0 )) + i.x + vec4(i1.x, i2.x, i3.x, 1.0 )); vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ; vec4 p0 = grad4(j0,   ip); vec4 p1 = grad4(j1.x, ip); vec4 p2 = grad4(j1.y, ip); vec4 p3 = grad4(j1.z, ip); vec4 p4 = grad4(j1.w, ip); vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w; p4 *= taylorInvSqrt(dot(p4,p4)); vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0); vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0); m0 = m0 * m0; m1 = m1 * m1; return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ))) + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;}
  
  void main() {
    // resolution + uParticles are given by the GPUComputationRenderer
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle =  texture2D(uParticles, uv);
    vec4 baseParticle = texture2D(uBaseParticlesTexture, uv);

    float uRepelStrength = uMouseDelta;
    uRepelStrength = mix(uRepelStrength, 0.0, uMouseDelta);
    uRepelStrength *= uRepulsionForce;
    vec3 particlePos = particle.xyz;
    vec3 mousePos = uMouse.xyz;
    vec3 dir = normalize(particlePos - mousePos);
    float dist = distance(mousePos, particlePos);
    float repulsionForce = uRepelStrength / (dist * (dist + 1.0));
    vec3 repulsion = dir * repulsionForce;

    if(uInteractive){
      particle.xyz += repulsion * uRepelStrength;
    }

    if (particle.a >= 1.0) {
        particle.a = mod(particle.a, 1.0); 
        particle.xyz = baseParticle.xyz;
    } 
    else {
        float disturbIntensity = (uDisturbIntensity > 0.0) ? pow(uDisturbIntensity, 2.0) : 0.0;
        float timer = (particle.a * disturbIntensity) + uTime;
        vec3 flowField = vec3(
            snoise(vec4(particle.xyz + disturbIntensity + 0.0, timer )),
            snoise(vec4(particle.yxz + disturbIntensity + 1.0, timer )),
            snoise(vec4(particle.zxy + disturbIntensity + 2.0, timer ))
        );
        flowField = normalize(flowField) * (2.0 * disturbIntensity);
        if(disturbIntensity > 0.0){
          particle.xyz += flowField * uDeltaTime * particle.a;
          particle.a += uDeltaTime;
        } else {
          particle.a += uDeltaTime;
        }
    }
    gl_FragColor.rgba = particle;
}

`;
const ParticlesVertexShader = /*glsl*/ `
  uniform float uSize;
  uniform vec2 uMouse;
  uniform vec3 uColors[2];
  uniform sampler2D uParticlesTexture;
  uniform vec2 uResolution;
  attribute vec2 aParticlesUv;
  attribute vec2 aMeshUv;
  attribute float aParticlesSize;
  attribute vec3 aParticlesColor;
  attribute vec3 aNormal;
  varying vec3 vColor[2];
  varying vec3 vPosition;
  varying float vParticlesAlpha;
  varying vec2 vMeshUv;
  varying vec3 vNormal;
  varying vec3 vParticleTexture;

  void main() {
    vec4 particle = texture2D(uParticlesTexture, aParticlesUv);
    vec4 modelPosition = modelMatrix * vec4(particle.xyz, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    /* Point Size */
    float lifeSize = 1.0-smoothstep(0.5, 1.0, particle.a);
    gl_PointSize = aParticlesSize * lifeSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    /* Variables to the fragment Shader */
    vColor = uColors;
    vPosition = position.xyz;
    vParticlesAlpha = particle.a;
    vParticleTexture = particle.xyz;
    vMeshUv = aMeshUv;
    vNormal = aNormal;
  }
`;
const ParticlesFragmentShader = /*glsl*/ `
  uniform float uTime;
  uniform sampler2D uMeshMap;
  uniform int uShape; // 1: disc | 2: ring | 3: sphere | 4: square
  uniform bool uHasLightSource;
  uniform vec3 uLightSource;
  uniform vec3 uLightSourceColor;
  uniform float uLightSourceIntensity;
  uniform bool uHasColors;
  varying vec3 vColor[2];
  varying float vParticlesAlpha;
  varying vec2 vMeshUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vParticleTexture;

  void main() {
      vec2 uv = gl_PointCoord.xy;
      vec3 diffuseMap = texture2D(uMeshMap, vMeshUv).rgb;
      float circle = 1.0;
      if (uShape == 1) {
        circle = 1.0-length(uv - vec2(0.5));
        circle = smoothstep(0.5, 0.51, circle);
      } 
       if (uShape == 2) {
        circle = length(uv - vec2(0.5));
        circle = smoothstep(0.4, 0.4+0.1, circle);
        circle -= smoothstep(0.6, 0.6+0.1, circle);
      }
      if (uShape == 3) {
          circle = length(uv - vec2(0.5));
          circle = smoothstep(0.5, 0.0, circle);
      }
      if(circle < 0.01) discard;

      /* Lighting */
      float light = 1.0;
      float lightIntensity = 1.0;
      float specular = 0.0;
      vec3 lightColor = vec3(1.0);
      if(uHasLightSource) {
        vec3 lightDir = normalize(uLightSource - vPosition);
        vec3 normal = normalize(vNormal);
        vec3 reflectDir = reflect(-lightDir, normal);
        vec3 viewDir = normalize(cameraPosition - vPosition);
        light = max(dot(normal, lightDir), 0.08);
        lightIntensity = 0.5 + uLightSourceIntensity;
        specular = pow(max(dot(viewDir, reflectDir), 0.0), 1.0);
        specular *= 0.5;
        lightColor = uLightSourceColor;
      }

      float circleSphere =  length(uv - vec2(0.5));
      circleSphere = smoothstep(1.0, 0.0, circleSphere);
      circleSphere = pow(circleSphere, 2.0);

      vec3 color = vec3(1.0);
      if (uHasColors) {
        float colorType = (uShape == 3) ? circleSphere  : smoothstep(0.0, 1.0, 1.0-vNormal.y);
        color = mix(vColor[0], vColor[1], colorType);
      } else {
        color = diffuseMap;
      }
      color *= lightColor;
      color *= (light * lightIntensity) + specular;
      //color = vParticleTexture;
 
      gl_FragColor.rgba = vec4(color, 1.0);
  }
`;
const ParticlesMaterial = memo(
  forwardRef((props, ref) => {
    const uniforms = useMemo(() => {
      return {
        uTime: new Uniform(0),
        uSize: new Uniform(0.4),
        uColors: new Uniform([]),
        uHasColors: new Uniform(false),
        uShape: new Uniform(1),
        uMeshMap: new Uniform(null),
        uParticlesTexture: new Uniform(null),
        uResolution: new Uniform([0, 0]),
        uHasLightSource: new Uniform(false),
        uLightSource: new Uniform(new Vector3()),
        uLightSourceColor: new Uniform(new Vector3()),
        uLightSourceIntensity: new Uniform(1.0),
      };
    }, []);
    return <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={ParticlesVertexShader} fragmentShader={ParticlesFragmentShader} />;
  })
);
const ParticleShapeIntValue = shapeString => {
  switch (shapeString) {
    case "disc":
      return 1;
    case "ring":
      return 2;
    case "sphere":
      return 3;
    case "square":
      return 4;
    default:
      return 1;
  }
};
const InitMeshWrapper = forwardRef(({ children, visible, onUpdate, onPointerMove }, ref) => {
  const handleUpdate = e => onUpdate(e);
  const handlePointerMove = e => onPointerMove(e);
  const clonedChildren = React.Children.map(children, child => {
    const { position = [0, 0, 0] } = child.props;
    return React.cloneElement(child, {
      ref,
      scale: 0.98,
      position,
      visible,
      onUpdate: handleUpdate,
      onPointerMove: handlePointerMove,
    });
  });

  return <>{clonedChildren}</>;
});
const DebugMessage = (mssg, color = "red") => {
  console.log(`%c ${mssg}`, `color: white; background-color: ${color}; font-size: 12px; padding: 4px; border-radius: 4px;`);
};
const FlowFieldParticles = ({
  debug = false,
  name = null,
  interactive = true,
  childMeshVisible = false,
  colors = null,
  size = 0.1,
  disturbIntensity = 0.3,
  repulsionForce = 1.0,
  shape = "disc",
  lightSource = null,
  children,
}) => {
  const [initMeshRef, setInitMeshRef] = useState(null);
  const ref = useRef(null);
  const meshRef = useRef(null);
  const particlesRef = useRef(null);
  const particlesMaterialRef = useRef(null);
  const helperRef = useRef(null);
  const mouseRef = useRef(new Vector3());
  const meshWorldPosition = useMemo(() => new Vector3(), []);
  const previousTime = useRef(0);
  const gl = useThree(state => state.gl);

  const modelMesh = useMemo(() => {
    if (!meshRef.current) return;
    return meshRef.current;
  }, [initMeshRef]);
  const modelGeometry = useMemo(() => {
    if (!modelMesh) return;
    if (debug) {
      DebugMessage(`${name} - modelGeometry()`, "green");
    }
    const { geometry, material } = modelMesh;
    const { attributes } = geometry;
    const { count } = attributes.position;
    return { geometry, material, attributes, count };
  }, [modelMesh]);
  const gpgpu = useMemo(() => {
    if (!modelGeometry) return;
    if (debug) {
      DebugMessage(`${name} - gpgpu()`, "green");
    }

    const size = Math.ceil(Math.sqrt(modelGeometry.count));
    const GCR = new GPUComputationRenderer(size, size, gl);
    const dataTexture = GCR.createTexture(); // RGBA DATA Texture

    for (let i = 0; i < modelGeometry.count; i++) {
      dataTexture.image.data[i * 4 + 0] = modelGeometry.attributes.position.array[i * 3 + 0];
      dataTexture.image.data[i * 4 + 1] = modelGeometry.attributes.position.array[i * 3 + 1];
      dataTexture.image.data[i * 4 + 2] = modelGeometry.attributes.position.array[i * 3 + 2];
      dataTexture.image.data[i * 4 + 3] = Math.random();
    }

    const particlesVariable = GCR.addVariable("uParticles", GpgpuFragmentShader, dataTexture);
    GCR.setVariableDependencies(particlesVariable, [particlesVariable]);

    GCR.init();
    const renderTarget = GCR.getCurrentRenderTarget(particlesVariable);
    const renderTargetTexture = renderTarget.texture;

    // Uniforms
    particlesVariable.material.uniforms.uTime = new Uniform(0);
    particlesVariable.material.uniforms.uDeltaTime = new Uniform(0);
    particlesVariable.material.uniforms.uBaseParticlesTexture = new Uniform(dataTexture);
    particlesVariable.material.uniforms.uDisturbIntensity = new Uniform(disturbIntensity);
    particlesVariable.material.uniforms.uRepulsionForce = new Uniform(repulsionForce);
    particlesVariable.material.uniforms.uMouse = new Uniform(new Vector3(0, 0, 0));
    particlesVariable.material.uniforms.uMouseDelta = new Uniform(0);
    particlesVariable.material.uniforms.uInteractive = new Uniform(interactive);

    return { ref: GCR, texture: renderTargetTexture, particlesVariable, size };
  }, [modelGeometry]);

  const particles = useMemo(() => {
    if (!modelGeometry) return;
    if (debug) {
      DebugMessage(`${name} - particles()`, "green");
    }
    const particlesUvArray = new Float32Array(modelGeometry.count * 2);
    const particlesSizeArray = new Float32Array(modelGeometry.count);
    for (let y = 0; y < gpgpu.size; y++) {
      for (let x = 0; x < gpgpu.size; x++) {
        const i = y * gpgpu.size + x;
        const i2 = i * 2;
        const uvX = (x + 0.5) / gpgpu.size; // (x+0.5) pour centrer le px
        const uvY = (y + 0.5) / gpgpu.size;
        // Set UV Position
        particlesUvArray[i2 + 0] = uvX;
        particlesUvArray[i2 + 1] = uvY;
        // Random size
        particlesSizeArray[i] = Math.random();
      }
    }
    const geometry = new BufferGeometry();
    geometry.setDrawRange(0, modelGeometry.count);
    geometry.setAttribute("aParticlesUv", new BufferAttribute(particlesUvArray, 2));
    geometry.setAttribute("aParticlesSize", new BufferAttribute(particlesSizeArray, 1));
    modelGeometry.attributes.color &&
      geometry.setAttribute("aParticlesColor", new BufferAttribute(modelGeometry.attributes.color.array, 3));
    modelGeometry.attributes.position && geometry.setAttribute("position", new BufferAttribute(modelGeometry.attributes.position.array, 3));
    modelGeometry.attributes.uv && geometry.setAttribute("aMeshUv", new BufferAttribute(modelGeometry.attributes.uv.array, 2));
    return { geometry, material: null, uvAttribute: particlesUvArray };
  }, [modelGeometry]);
  const handlePointerMove = useCallback(e => {
    const { point, object } = e;
    object.getWorldPosition(meshWorldPosition);
    if (mouseRef.current) {
      const { x, y, z } = point.sub(meshWorldPosition);
      mouseRef.current.set(x, y, z);
    }
  }, []);

  useEffect(() => {
    if (debug) {
      DebugMessage(`${name} - useEffect()`, "purple");
    }
    if (gpgpu) {
      gpgpu.particlesVariable.material.uniforms.uInteractive.value = interactive;
    }
    if (particlesRef.current) {
      particlesRef.current.geometry.setAttribute("aNormal", modelGeometry.attributes.normal);
    }
    if (particlesMaterialRef.current) {
      particlesMaterialRef.current.uniforms.uHasColors.value = true;
      const colorsArray = colors?.map(color => {
        if (typeof color === "string") {
          return new Color(color);
        } else {
          if (typeof color === "object" && "isColor" in color) {
            return color;
          }
        }
      }) || [modelGeometry.material.color, modelGeometry.material.color];
      particlesMaterialRef.current.uniforms.uColors.value = colorsArray;
      particlesMaterialRef.current.uniforms.uSize.value = size;

      if (lightSource) {
        let light;
        if ("current" in lightSource) {
          light = lightSource.current;
        } else if ("position" in lightSource) {
          light = lightSource;
        }

        if ("position" in light) {
          particlesMaterialRef.current.uniforms.uHasLightSource.value = true;
          particlesMaterialRef.current.uniforms.uLightSource.value.copy(light.position);
        }
        if ("color" in light) {
          particlesMaterialRef.current.uniforms.uLightSourceColor = new Uniform(light.color);
        }
        if ("intensity" in light) {
          particlesMaterialRef.current.uniforms.uLightSourceIntensity = new Uniform(light.intensity);
        }
      } else {
        particlesMaterialRef.current.uniforms.uHasLightSource.value = false;
      }
      particlesMaterialRef.current.uniforms.uShape.value = ParticleShapeIntValue(shape);

      if (modelMesh?.material?.map) {
        particlesMaterialRef.current.uniforms.uHasColors.value = false;
        particlesMaterialRef.current.uniforms.uMeshMap.value = modelMesh.material.map;
      }
    }
  }, [colors, size, shape, lightSource, interactive, particles]);
  let lastMousePosX = 0;
  let mouseDeltaValue = 0;

  useFrame(({ clock, camera }) => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = Math.min(elapsedTime - previousTime.current, 1 / 60);
    previousTime.current = elapsedTime;
    mouseDeltaValue = MathUtils.lerp(mouseDeltaValue, Math.abs(lastMousePosX - mouseRef.current.x), 0.1);
    if (particlesRef.current) {
      particlesRef.current.position.copy(modelMesh.position);
      //modelMesh.position.copy(modelMesh.position);
    }
    if (particlesMaterialRef.current) {
      /** Gpgpu computation */
      gpgpu.ref.compute();
      gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
      gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;
      gpgpu.particlesVariable.material.uniforms.uDisturbIntensity.value = disturbIntensity;
      gpgpu.particlesVariable.material.uniforms.uRepulsionForce.value = repulsionForce;
      gpgpu.particlesVariable.material.uniforms.uMouse.value.copy(mouseRef.current);
      gpgpu.particlesVariable.material.uniforms.uMouseDelta.value = mouseDeltaValue;

      /** Particles Material uniforms */
      particlesMaterialRef.current.uniforms.uTime.value = elapsedTime;
      particlesMaterialRef.current.uniforms.uResolution.value = [gpgpu.size, gpgpu.size];
      particlesMaterialRef.current.uniforms.uParticlesTexture.value = gpgpu.ref.getCurrentRenderTarget(gpgpu.particlesVariable).texture;
      lightSource && particlesMaterialRef.current.uniforms.uLightSource.value.copy(lightSource.current.position);

      /** Helper */
      helperRef.current?.position.copy(mouseRef.current).add(modelMesh.position);
    }
    /** Mouse */
    lastMousePosX = MathUtils.lerp(lastMousePosX, mouseRef.current.x, 0.5);
  });
  if (debug) {
    DebugMessage(`${name} - <FlowFieldParticles />`, "blue");
  }
  return (
    <group ref={ref}>
      {particles && (
        <points visible={true} ref={particlesRef} geometry={particles?.geometry} position={modelMesh?.position}>
          <ParticlesMaterial ref={particlesMaterialRef} attach='material' />
        </points>
      )}
      <InitMeshWrapper
        ref={meshRef}
        visible={childMeshVisible}
        onUpdate={e => {
          if (e) setInitMeshRef(e);
        }}
        onPointerMove={handlePointerMove}
      >
        {children}
      </InitMeshWrapper>

      {debug && (
        <mesh ref={helperRef} position={[0, 0, 0]} scale={0.5}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshBasicMaterial color='red' />
        </mesh>
      )}
    </group>
  );
};

export { FlowFieldParticles };
