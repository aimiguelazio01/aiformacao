import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { HERO_CONFIG } from '../config';

const BACKGROUND = 0x060814;

interface FeatureCardConfig {
  title: string;
  subtitle: string;
  iconSvg: string;
  position: THREE.Vector3;
  floatPhase: number;
  floatSpeed: number;
}

// Inline SVGs for the 5 cards matching the reference image
const ICONS = {
  chat: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  `,
  generate: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  `,
  analyse: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  `,
  automate: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  `,
  personalise: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  `,
};

function createFeatureCard(card: FeatureCardConfig): CSS2DObject {
  const element = document.createElement('div');
  element.className = 'scene-feature-card';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', `${card.title}: ${card.subtitle}`);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'feature-card__icon';
  iconWrap.innerHTML = card.iconSvg.trim();

  const contentWrap = document.createElement('div');
  contentWrap.className = 'feature-card__content';

  const title = document.createElement('span');
  title.className = 'feature-card__title';
  title.textContent = card.title;

  const subtitle = document.createElement('span');
  subtitle.className = 'feature-card__subtitle';
  subtitle.textContent = card.subtitle;

  contentWrap.append(title, subtitle);
  element.append(iconWrap, contentWrap);

  const obj = new CSS2DObject(element);
  obj.position.copy(card.position);
  obj.userData = {
    baseY: card.position.y,
    baseX: card.position.x,
    floatPhase: card.floatPhase,
    floatSpeed: card.floatSpeed,
  };
  return obj;
}

/**
 * Creates high-res canvas texture displaying glowing 3D "AI" letters
 */
function createAiTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    // Glow background
    const gradient = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
    gradient.addColorStop(0, 'rgba(120, 160, 255, 0.45)');
    gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Bold display "AI" text with intense inner luminescence
    ctx.font = '900 240px "Space Grotesk", "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#93c5fd';
    ctx.fillText('AI', 256, 256);

    // Core bright text
    ctx.shadowColor = '#c7d2fe';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('AI', 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates the central glowing AI Crystal Cube resting on the pedestal
 */
function createAiCrystalCube(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'AI Crystal Cube';

  // Outer translucent glass cube with physical material
  const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x93c5fd,
    transmission: 0.72,
    opacity: 0.95,
    transparent: true,
    roughness: 0.08,
    metalness: 0.15,
    ior: 1.45,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    depthWrite: false,
  });
  const glassCube = new THREE.Mesh(cubeGeo, glassMat);
  group.add(glassCube);

  // Crystalline glowing edge wireframe
  const edgesGeo = new THREE.EdgesGeometry(cubeGeo);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xa5b4fc,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const edgesLine = new THREE.LineSegments(edgesGeo, edgesMat);
  group.add(edgesLine);

  // Inner illuminated 3D "AI" sign
  const aiTex = createAiTexture();
  const planeGeo = new THREE.PlaneGeometry(1.05, 1.05);
  const planeMat = new THREE.MeshBasicMaterial({
    map: aiTex,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const aiPlaneFront = new THREE.Mesh(planeGeo, planeMat);
  aiPlaneFront.position.z = 0.05;
  group.add(aiPlaneFront);

  const aiPlaneBack = new THREE.Mesh(planeGeo, planeMat);
  aiPlaneBack.position.z = -0.05;
  aiPlaneBack.rotation.y = Math.PI;
  group.add(aiPlaneBack);

  // Internal neon point light radiating from inside the cube
  const coreLight = new THREE.PointLight(0x60a5fa, 4.5, 4.5, 1.8);
  coreLight.position.set(0, 0, 0);
  group.add(coreLight);

  // Subtle inner glowing sphere
  const innerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    }),
  );
  group.add(innerSphere);

  // Initial tilt matching the reference mockup
  group.rotation.set(0.32, 0.72, -0.15);

  return group;
}

/**
 * Creates the dark basalt / rock pedestal platform with glowing neon rim ring
 */
function createRockPedestal(): THREE.Group {
  const pedestal = new THREE.Group();
  pedestal.name = 'Basalt Pedestal';

  // Base metallic cylinder platform
  const baseCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1.68, 1.76, 0.22, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0c0f17,
      metalness: 0.5,
      roughness: 0.65,
      flatShading: true,
    }),
  );
  baseCylinder.position.y = -0.72;
  pedestal.add(baseCylinder);

  // Neon glowing circular rim ring
  const neonRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.69, 0.032, 16, 64),
    new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.95,
    }),
  );
  neonRing.rotation.x = Math.PI / 2;
  neonRing.position.y = -0.61;
  pedestal.add(neonRing);

  // Second violet outer rim light for depth
  const neonRingOuter = new THREE.Mesh(
    new THREE.TorusGeometry(1.74, 0.018, 16, 64),
    new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.65,
    }),
  );
  neonRingOuter.rotation.x = Math.PI / 2;
  neonRingOuter.position.y = -0.62;
  pedestal.add(neonRingOuter);

  // Rugged rock boulders cluster creating the textured natural basalt rock
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x131722,
    roughness: 0.92,
    metalness: 0.18,
    flatShading: true,
  });

  const rockPositions = [
    { pos: new THREE.Vector3(0, -0.42, 0), scale: new THREE.Vector3(1.42, 0.44, 1.35), rot: 0.4 },
    { pos: new THREE.Vector3(-0.35, -0.4, 0.28), scale: new THREE.Vector3(0.9, 0.38, 0.85), rot: 1.1 },
    { pos: new THREE.Vector3(0.42, -0.44, -0.22), scale: new THREE.Vector3(0.85, 0.36, 0.9), rot: 2.3 },
    { pos: new THREE.Vector3(0.2, -0.38, 0.38), scale: new THREE.Vector3(0.75, 0.32, 0.75), rot: 0.8 },
  ];

  rockPositions.forEach(({ pos, scale, rot }) => {
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), rockMaterial);
    boulder.position.copy(pos);
    boulder.scale.copy(scale);
    boulder.rotation.set(rot, rot * 1.5, rot * 0.7);
    pedestal.add(boulder);
  });

  // Upward neon ring light
  const ringLight = new THREE.PointLight(0x60a5fa, 3.2, 3.8, 1.8);
  ringLight.position.set(0, -0.48, 0.2);
  pedestal.add(ringLight);

  return pedestal;
}

/**
 * Creates curved orbital trajectory lines and glowing tracking particles
 */
function createOrbitalSystem(): { group: THREE.Group; update: (time: number) => void } {
  const group = new THREE.Group();
  group.name = 'Orbital System';

  // Orbit 1: Tilted wide ellipse
  const curve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.9, -0.3, 1.2),
    new THREE.Vector3(-1.1, 1.2, 0.5),
    new THREE.Vector3(1.5, 1.4, -0.8),
    new THREE.Vector3(2.4, -0.1, -0.4),
    new THREE.Vector3(0.8, -0.9, 0.8),
    new THREE.Vector3(-1.9, -0.3, 1.2),
  ]);

  const geo1 = new THREE.BufferGeometry().setFromPoints(curve1.getPoints(120));
  const mat1 = new THREE.LineBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  group.add(new THREE.Line(geo1, mat1));

  // Orbit 2: Crossing orbital loop
  const curve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.4, 0.8, -0.6),
    new THREE.Vector3(0.6, 1.5, 0.8),
    new THREE.Vector3(2.1, 0.4, 0.9),
    new THREE.Vector3(1.2, -0.8, -0.5),
    new THREE.Vector3(-0.9, -0.6, -0.9),
    new THREE.Vector3(-1.4, 0.8, -0.6),
  ]);

  const geo2 = new THREE.BufferGeometry().setFromPoints(curve2.getPoints(120));
  const mat2 = new THREE.LineBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  group.add(new THREE.Line(geo2, mat2));

  // Traveling glowing nodes along orbits
  const nodeMat1 = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
  const node1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), nodeMat1);
  group.add(node1);

  const nodeMat2 = new THREE.MeshBasicMaterial({ color: 0xa5b4fc });
  const node2 = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), nodeMat2);
  group.add(node2);

  return {
    group,
    update(time: number) {
      const t1 = (time * 0.08) % 1;
      const t2 = (time * 0.06 + 0.5) % 1;
      node1.position.copy(curve1.getPoint(t1));
      node2.position.copy(curve2.getPoint(t2));
    },
  };
}

/**
 * Creates floating ambient geometric shards & glossy spheres matching reference image
 */
function createFloatingAccents(): THREE.Group {
  const accents = new THREE.Group();
  accents.name = 'Floating Accents';

  // Glossy purple glass sphere (top-left)
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x4338ca,
    emissive: 0x1e1b4b,
    emissiveIntensity: 0.4,
    metalness: 0.65,
    roughness: 0.22,
  });
  const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 20), sphereMat);
  sphere1.position.set(-1.3, 1.25, 0.4);
  accents.add(sphere1);

  // Glossy purple glass sphere (bottom-right)
  const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 20), sphereMat);
  sphere2.position.set(2.4, -0.48, 0.7);
  accents.add(sphere2);

  // Floating dark crystalline pyramid shard (left)
  const shardMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.35,
    flatShading: true,
  });
  const shard1 = new THREE.Mesh(new THREE.TetrahedronGeometry(0.38), shardMat);
  shard1.position.set(-1.5, 0.15, 0.5);
  shard1.rotation.set(0.4, 0.8, 0.2);
  accents.add(shard1);

  // Floating dark crystalline shard (top-right)
  const shard2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), shardMat);
  shard2.position.set(2.6, 1.1, -0.8);
  shard2.rotation.set(0.8, 0.4, 0.9);
  accents.add(shard2);

  return accents;
}

/**
 * Background star dust & depth particles
 */
function createParticleField(): THREE.Points {
  const { count, seed } = HERO_CONFIG.particles;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  let state = seed;

  const random = (): number => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (random() - 0.5) * 24;
    positions[offset + 1] = (random() - 0.5) * 12;
    positions[offset + 2] = 4 - random() * 26;

    const isViolet = random() > 0.45;
    const color = new THREE.Color().setHSL(
      isViolet ? 0.68 : 0.58,
      0.75,
      0.72 + random() * 0.2,
    );
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.042,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.65,
    depthTest: true,
    depthWrite: false,
    vertexColors: true,
  });

  return new THREE.Points(geometry, material);
}

export interface HeroScene {
  canvas: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  setViewpoint: (normalizedX: number, normalizedY: number, normalizedZ?: number) => void;
  render: (now?: number) => void;
  dispose: () => void;
  onContextLost: (callback: () => void) => () => void;
}

export function createHeroScene(canvas: HTMLCanvasElement): HeroScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(BACKGROUND, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, HERO_CONFIG.render.maxPixelRatio));

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'hero__labels-layer';
  canvas.parentElement?.append(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.Fog(BACKGROUND, 16, 42);

  const camera = new THREE.PerspectiveCamera(
    HERO_CONFIG.camera.fieldOfView,
    1,
    HERO_CONFIG.camera.near,
    HERO_CONFIG.camera.far,
  );
  camera.position.set(0, 0.05, HERO_CONFIG.camera.positionZ);
  camera.lookAt(0, 0, 0);

  // Cinematic Lighting matching reference
  scene.add(new THREE.AmbientLight(0x181c2e, 1.4));
  scene.add(new THREE.HemisphereLight(0x7388ff, 0x060814, 1.2));

  const keyLight = new THREE.DirectionalLight(0x93c5fd, 2.2);
  keyLight.position.set(-2, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x818cf8, 2.0);
  rimLight.position.set(5, 3, -2);
  scene.add(rimLight);

  const bottomWarmLight = new THREE.PointLight(0x6366f1, 3.5, 12, 1.6);
  bottomWarmLight.position.set(2.4, -2.5, 2.0);
  scene.add(bottomWarmLight);

  // Master group containing all hero 3D visuals
  const visualRoot = new THREE.Group();
  visualRoot.name = 'Hero 3D Composition';

  // Base position: on desktop offset to the right column
  visualRoot.position.set(2.5, 0.05, 0);
  scene.add(visualRoot);

  // 1. Rock Pedestal
  const pedestal = createRockPedestal();
  visualRoot.add(pedestal);

  // 2. Glowing AI Crystal Cube
  const aiCube = createAiCrystalCube();
  aiCube.position.set(0, 0.35, 0.1);
  visualRoot.add(aiCube);

  // 3. Orbital Paths & Traveling Nodes
  const orbitals = createOrbitalSystem();
  visualRoot.add(orbitals.group);

  // 4. Floating Ambient Accents (spheres & shards)
  const accents = createFloatingAccents();
  visualRoot.add(accents);

  // 5. Five Floating Glass Feature Cards matching the reference layout
  const cardsConfig: FeatureCardConfig[] = [
    {
      title: 'Chat & Assist',
      subtitle: 'Custom AI assistants',
      iconSvg: ICONS.chat,
      position: new THREE.Vector3(-0.4, 1.72, 0.35),
      floatPhase: 0,
      floatSpeed: 0.65,
    },
    {
      title: 'Generate',
      subtitle: 'Images · Video · 3D',
      iconSvg: ICONS.generate,
      position: new THREE.Vector3(2.05, 1.45, -0.4),
      floatPhase: 1.8,
      floatSpeed: 0.55,
    },
    {
      title: 'Analyse',
      subtitle: 'Turn data into insights',
      iconSvg: ICONS.analyse,
      position: new THREE.Vector3(-1.75, 0.68, 0.7),
      floatPhase: 3.2,
      floatSpeed: 0.7,
    },
    {
      title: 'Automate',
      subtitle: 'Smarter workflows',
      iconSvg: ICONS.automate,
      position: new THREE.Vector3(2.35, 0.32, -0.1),
      floatPhase: 4.5,
      floatSpeed: 0.6,
    },
    {
      title: 'Personalise',
      subtitle: 'Unique experiences',
      iconSvg: ICONS.personalise,
      position: new THREE.Vector3(-1.55, -0.42, 0.85),
      floatPhase: 2.4,
      floatSpeed: 0.62,
    },
  ];

  const cardObjects: CSS2DObject[] = [];
  cardsConfig.forEach((cfg) => {
    const cardObj = createFeatureCard(cfg);
    visualRoot.add(cardObj);
    cardObjects.push(cardObj);
  });

  // Background Particles
  scene.add(createParticleField());

  let disposed = false;
  const contextLostCallbacks = new Set<() => void>();
  const contextLostHandler = (event: Event): void => {
    event.preventDefault();
    contextLostCallbacks.forEach((callback) => callback());
  };
  canvas.addEventListener('webglcontextlost', contextLostHandler, false);

  return {
    canvas,
    resize(width, height) {
      if (disposed || width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Responsive positioning of 3D scene:
      // Desktop (> 1024px): offset to right (+2.4)
      // Tablet (768px - 1024px): slightly offset (+1.2)
      // Mobile (< 768px): centered (0) and scaled down
      if (width < HERO_CONFIG.render.mobileBreakpoint) {
        visualRoot.position.set(0, -0.45, -1.2);
        visualRoot.scale.setScalar(0.68);
      } else if (width < HERO_CONFIG.render.tabletBreakpoint) {
        visualRoot.position.set(1.2, -0.1, -0.4);
        visualRoot.scale.setScalar(0.85);
      } else {
        visualRoot.position.set(2.4, 0.05, 0);
        visualRoot.scale.setScalar(1.0);
      }

      renderer.setSize(width, height, false);
      labelRenderer.setSize(width, height);
    },
    setViewpoint(normalizedX, normalizedY, normalizedZ = 0) {
      camera.position.set(
        normalizedX * HERO_CONFIG.camera.travelX,
        0.05 + normalizedY * HERO_CONFIG.camera.travelY,
        HERO_CONFIG.camera.positionZ + normalizedZ * HERO_CONFIG.camera.travelZ,
      );
    },
    render(now = performance.now()) {
      if (disposed) return;
      const seconds = now / 1000;

      // Gentle floating animation of the central AI Crystal Cube
      aiCube.rotation.y = 0.72 + Math.sin(seconds * 0.45) * 0.08;
      aiCube.rotation.x = 0.32 + Math.cos(seconds * 0.35) * 0.05;
      aiCube.position.y = 0.35 + Math.sin(seconds * 0.75) * 0.04;

      // Update orbiting trajectory particles
      orbitals.update(seconds);

      // Subtle organic floating motion for feature cards
      cardObjects.forEach((card) => {
        const { baseY, floatPhase, floatSpeed } = card.userData;
        if (typeof baseY === 'number') {
          card.position.y = baseY + Math.sin(seconds * floatSpeed + floatPhase) * 0.06;
        }
      });

      // Ambient accents gentle rotation
      accents.rotation.y = seconds * 0.08;

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener('webglcontextlost', contextLostHandler);
      labelRenderer.domElement.remove();
      scene.traverse((object) => {
        if (!('geometry' in object)) return;
        const renderable = object as THREE.Mesh | THREE.Points;
        renderable.geometry.dispose();
        if (Array.isArray(renderable.material)) {
          renderable.material.forEach((material) => material.dispose());
        } else {
          renderable.material.dispose();
        }
      });
      renderer.dispose();
      contextLostCallbacks.clear();
    },
    onContextLost(callback) {
      contextLostCallbacks.add(callback);
      return () => contextLostCallbacks.delete(callback);
    },
  };
}
