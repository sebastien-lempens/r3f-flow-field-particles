import { useCallback, useEffect, useRef, useMemo } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import { Plane, ScreenSizer, Box, shaderMaterial, Sphere } from "@react-three/drei";
import { BufferGeometry, BufferAttribute, Color, Uniform, Vector3, Mesh, MathUtils } from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { bool } from "three/webgpu";

const GpgpuFragmentShader = /*glsl*/ `
  uniform float uTime;
  uniform float uDeltaTime;
  uniform vec3 uMouse;
  uniform float uMouseDelta;
  uniform float uDisturbIntensity;
  uniform sampler2D uBaseParticlesTexture;
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);} float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;} float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;} vec4 grad4(float j, vec4 ip){ const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0); vec4 p,s; p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0; p.w = 1.5 - dot(abs(p.xyz), ones.xyz); s = vec4(lessThan(p, vec4(0.0))); p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; return p; } float snoise(vec4 v){ const vec2  C = vec2( 0.138196601125010504, 0.309016994374947451); vec4 i  = floor(v + dot(v, C.yyyy) ); vec4 x0 = v -   i + dot(i, C.xxxx); vec4 i0; vec3 isX = step( x0.yzw, x0.xxx ); vec3 isYZ = step( x0.zww, x0.yyz ); i0.x = isX.x + isX.y + isX.z; i0.yzw = 1.0 - isX; i0.y += isYZ.x + isYZ.y; i0.zw += 1.0 - isYZ.xy; i0.z += isYZ.z; i0.w += 1.0 - isYZ.z; vec4 i3 = clamp( i0, 0.0, 1.0 ); vec4 i2 = clamp( i0-1.0, 0.0, 1.0 ); vec4 i1 = clamp( i0-2.0, 0.0, 1.0 ); vec4 x1 = x0 - i1 + 1.0 * C.xxxx; vec4 x2 = x0 - i2 + 2.0 * C.xxxx; vec4 x3 = x0 - i3 + 3.0 * C.xxxx; vec4 x4 = x0 - 1.0 + 4.0 * C.xxxx; i = mod(i, 289.0); float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x); vec4 j1 = permute( permute( permute( permute ( i.w + vec4(i1.w, i2.w, i3.w, 1.0 )) + i.z + vec4(i1.z, i2.z, i3.z, 1.0 )) + i.y + vec4(i1.y, i2.y, i3.y, 1.0 )) + i.x + vec4(i1.x, i2.x, i3.x, 1.0 )); vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ; vec4 p0 = grad4(j0,   ip); vec4 p1 = grad4(j1.x, ip); vec4 p2 = grad4(j1.y, ip); vec4 p3 = grad4(j1.z, ip); vec4 p4 = grad4(j1.w, ip); vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w; p4 *= taylorInvSqrt(dot(p4,p4)); vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0); vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0); m0 = m0 * m0; m1 = m1 * m1; return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ))) + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;}
  
  void main() {
    // resolution + uParticles are given by the GPUComputationRenderer
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle =  texture2D(uParticles, uv);
    vec4 baseParticle = texture2D(uBaseParticlesTexture, uv);

    float uRepelStrength = uMouseDelta;
    uRepelStrength = mix(uRepelStrength, 0.0, uMouseDelta);
    vec2 particlePos = particle.xy;
    vec2 mousePos = uMouse.xy;
    float dist = distance(mousePos, particlePos);
    vec2 dir = normalize(particlePos - mousePos);
    float repulsionForce = uRepelStrength / (dist * (dist + 1.0));
    vec2 repulsion = dir * repulsionForce;

    particle.xy += repulsion * uRepelStrength;

    if (particle.a >= 1.0) {
        particle.a = mod(particle.a, 1.0); 
        particle.xyz = baseParticle.xyz;
    } 
    else {
        float timer = uTime / 10.0;
        float disturbIntensity = 0.5 + pow(uDisturbIntensity, 4.0);
        vec3 flowField = vec3(
            snoise(vec4(particle.xyz + disturbIntensity, timer )),
            snoise(vec4(particle.yxz + disturbIntensity, timer )),
            snoise(vec4(particle.zxy + disturbIntensity, timer ))
        );
        flowField = normalize(flowField);
        particle.xyz += flowField * disturbIntensity * uDeltaTime * particle.a;
        particle.a += uDeltaTime;
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
  varying vec3 vColor[2];
  varying vec3 vPosition;
  varying float vParticlesAlpha;
  varying vec2 vMeshUv;

  void main() {
    vec4 particle = texture2D(uParticlesTexture, aParticlesUv);
    vec4 particleViewPosition =  viewMatrix * vec4(particle.xyz, 1.0);
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
    vMeshUv = aMeshUv;
  }
`;
const ParticlesFragmentShader = /*glsl*/ `
  uniform sampler2D uMeshMap;
  uniform bool uShadeColor;
  varying vec3 vColor[2];
  varying vec3 vViewPosition;
  varying float vParticlesAlpha;
  varying vec2 vMeshUv;
  varying vec3 vPosition;
  void main() {
      vec2 uv = gl_PointCoord.xy;
      float circle = length(uv - vec2(0.5));
      vec3 diffuseMap = texture2D(uMeshMap, vMeshUv).rgb;
      circle = smoothstep(0.5, 0.49, circle);
      if(circle < 0.01) discard;
      vec3 color = vec3(1.0);
      if (vColor[0].x > 0.0 && vColor[1].x > 0.0) {
        float colorType = uShadeColor ? 1.0-gl_PointCoord.y : smoothstep(0.0, 1.0, 1.0-vPosition.y);
        color = mix(vColor[0], vColor[1], colorType);
      } else {
        color = diffuseMap;
      }
      gl_FragColor.rgba = vec4(color, 1.0);
  }
`;
const ParticlesMaterial = shaderMaterial(
  {
    uSize: 0.4,
    uShadeColor: bool,
    uColors: [],
    uMeshMap: null,
    uParticlesTexture: null,
    uResolution: [0, 0],
  },
  ParticlesVertexShader,
  ParticlesFragmentShader
);
extend({ ParticlesMaterial });

const FlowFieldParticles = ({ colors, size = 0.1, disturbIntensity = 0.3, shadeColor=false, children }) => {
  const particleslRef = useRef(null);
  const meshChildrenRef = useRef(null);
  const meshRef = useRef(null);
  const helperRef = useRef(null);
  const particlesMaterialRef = useRef(null);
  const mouseRef = useRef(new Vector3());
  const mouseDeltaRef = useRef(new Vector3());
  const gl = useThree(state => state.gl);

  const modelMesh = useMemo(() => {
    const { type } = children;
    let mesh = null;
    if ("object" in children.props && children.props.object.type === "Mesh") {
      mesh = children.props.object;
      if ("position" in children.props) mesh.position.copy(new Vector3().fromArray(children.props.position));
    } else {
      if (type === "mesh") {
        const { geometry, material, position } = children.props;
        if (meshRef.current) {
          mesh = meshRef.current;
        } else {
          mesh = new Mesh(geometry, material);
        }
        mesh.position.copy(new Vector3().fromArray(position));
      }
    }

    if (!mesh) throw "<FlowFieldParticles /> must have a mesh as a child";
    meshChildrenRef.current = mesh;
    return mesh;
  }, [children]);

  const modelGeometry = useMemo(() => {
    const { geometry } = modelMesh;
    const { attributes } = geometry;
    const { count } = attributes.position;
    return { geometry, attributes, count };
  }, [modelMesh.uuid]);
  const gpgpu = useMemo(() => {
    const size = Math.ceil(Math.sqrt(modelGeometry.count));
    const GCR = new GPUComputationRenderer(size, size, gl);
    const dataTexture = GCR.createTexture(); // RGBA DATA Texture

    for (let i = 0; i < modelGeometry.count; i++) {
      dataTexture.image.data[i * 4 + 0] = modelGeometry.attributes.position.array[i * 3 + 0];
      dataTexture.image.data[i * 4 + 1] = modelGeometry.attributes.position.array[i * 3 + 1];
      dataTexture.image.data[i * 4 + 2] = modelGeometry.attributes.position.array[i * 3 + 2];
      dataTexture.image.data[i * 4 + 3] = Math.random() * 2.0 - 1.0;
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
    particlesVariable.material.uniforms.uMouse = new Uniform(new Vector3(0, 0, 0));
    particlesVariable.material.uniforms.uMouseDelta = new Uniform(0);

    return { ref: GCR, texture: renderTargetTexture, particlesVariable, size };
  }, [modelMesh.uuid, disturbIntensity]);
  const particles = useMemo(() => {
    console.log("particles");
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
    modelGeometry.attributes.color && geometry.setAttribute("aParticlesColor", new BufferAttribute(modelGeometry.attributes.color.array, 3));
    modelGeometry.attributes.position && geometry.setAttribute("position", new BufferAttribute(modelGeometry.attributes.position.array, 3));
    modelGeometry.attributes.uv && geometry.setAttribute("aMeshUv", new BufferAttribute(modelGeometry.attributes.uv.array, 2));
    return { geometry, material: null, uvAttribute: particlesUvArray };
  }, [modelMesh.uuid]);
  const handlePointerMove = useCallback(e => {
    const { point, object } = e;
    const { position } = object;
    if (mouseRef.current) {
      const { x, y, z } = point.sub(position);
      mouseRef.current.set(x, y, z);
    }
  }, []);

  useEffect(() => {
    if (particlesMaterialRef.current) {
      const colorsArray = colors?.map(color => new Color(color)) || [new Color("black"), new Color("black")];
      particlesMaterialRef.current.transparent = true;
      particlesMaterialRef.current.uniforms.uColors.value = colorsArray;
      particlesMaterialRef.current.uniforms.uSize.value = size;
      particlesMaterialRef.current.uniforms.uShadeColor.value = shadeColor;
      if (modelMesh?.material?.map) {
        particlesMaterialRef.current.uniforms.uMeshMap.value = modelMesh.material.map;
      }
    }
  }, [colors, size, shadeColor]);

  let lastMousePosX = 0;
  let mouseDeltaValue = 0;

  useFrame(({ clock }, delta) => {
    const elapsedTime = clock.getElapsedTime();
    mouseDeltaValue = MathUtils.lerp(mouseDeltaValue, Math.abs(lastMousePosX - mouseRef.current.x), 0.1);
    if (particleslRef.current) {
      particleslRef.current.position.copy(modelMesh.position);
      meshRef.current.position.copy(modelMesh.position);
    }
    if (particlesMaterialRef.current) {
      gpgpu.ref.compute();
      mouseDeltaRef.current.sub(mouseRef.current);
      gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
      gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = delta;
      gpgpu.particlesVariable.material.uniforms.uMouse.value.copy(mouseRef.current);
      gpgpu.particlesVariable.material.uniforms.uMouseDelta.value = mouseDeltaValue;
      mouseDeltaRef.current.copy(mouseRef.current);

      particlesMaterialRef.current.uniforms.uResolution.value = [gpgpu.size, gpgpu.size];
      particlesMaterialRef.current.uniforms.uParticlesTexture.value = gpgpu.ref.getCurrentRenderTarget(gpgpu.particlesVariable).texture;
      helperRef.current.position.copy(mouseRef.current).add(modelMesh.position);
    }
    lastMousePosX = MathUtils.lerp(lastMousePosX, mouseRef.current.x, 0.5);
  });
  console.log("render <FlowFieldParticles />");
  return (
    <group>
      <points visible={true} ref={particleslRef} geometry={particles.geometry} position={modelMesh.position}>
        <particlesMaterial ref={particlesMaterialRef} attach='material' />
      </points>
      <mesh
        ref={meshRef}
        visible={false}
        onPointerMove={handlePointerMove}
        position={modelMesh.position}
        geometry={modelMesh.geometry}
        material={modelMesh.material}
      ></mesh>

      <Sphere ref={helperRef} position={[0, 0, 0]} scale={0.05}>
        <meshBasicMaterial color='red' />
      </Sphere>
      {/* <Plane visible={false} args={[3, 3, 1, 1]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <meshBasicMaterial map={gpgpu.texture} />
      </Plane> */}
    </group>
  );
};

export { FlowFieldParticles };
