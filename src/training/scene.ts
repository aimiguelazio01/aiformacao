import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { HERO_CONFIG } from '../config';
import { applyDeadZone, normalizePointer, smoothToward } from '../input/parallax';
import type { CompanyProfile } from './types';

const BACKGROUND = 0x080d18;

interface ConceptNode {
  id: string;
  name: string;
  category: string;
  position: THREE.Vector3;
  color: number;
}

const CONCEPTS: ConceptNode[] = [
  { id: 'documentos', name: 'Documentos', category: 'volumes', position: new THREE.Vector3(-3.2, 0.6, -2.5), color: 0x53d9f2 },
  { id: 'comunicacao', name: 'Comunicação', category: 'planes', position: new THREE.Vector3(3.4, 0.4, -3.2), color: 0x6598ff },
  { id: 'dados', name: 'Dados & Métricas', category: 'nodes', position: new THREE.Vector3(-2.2, -1.1, -4.5), color: 0x4dcce6 },
  { id: 'imagens', name: 'Imagens & Conceitos', category: 'planes', position: new THREE.Vector3(2.6, -1.0, -5.0), color: 0x9a7bff },
  { id: 'automacao', name: 'Automação', category: 'nodes', position: new THREE.Vector3(0.0, 1.2, -3.8), color: 0xffa967 },
  { id: 'pesquisa', name: 'Pesquisa', category: 'nodes', position: new THREE.Vector3(-3.8, -0.4, -6.5), color: 0x51cce7 },
  { id: 'conhecimento', name: 'Conhecimento', category: 'volumes', position: new THREE.Vector3(3.8, 1.1, -6.0), color: 0x867bff },
];

function makeSurface(color: number, emissiveIntensity = 0.22): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness: 0.2,
    roughness: 0.45,
    flatShading: true,
  });
}

function createSceneLabel(text: string, numberStr: string): CSS2DObject {
  const element = document.createElement('div');
  element.className = 'scene-label';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', text);

  const num = document.createElement('span');
  num.className = 'scene-label__index';
  num.setAttribute('aria-hidden', 'true');
  num.textContent = numberStr;

  const title = document.createElement('span');
  title.className = 'scene-label__title';
  title.textContent = text;

  element.append(num, title);
  return new CSS2DObject(element);
}

export interface TrainingScene {
  canvas: HTMLCanvasElement;
  updateProfile: (profile: CompanyProfile) => void;
  resize: (width: number, height: number) => void;
  render: (now?: number) => void;
  dispose: () => void;
  pause: () => void;
  resume: () => void;
}

export function createTrainingScene(container: HTMLElement, canvas: HTMLCanvasElement): TrainingScene {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(BACKGROUND, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const isMobile = window.innerWidth < HERO_CONFIG.render.mobileBreakpoint;
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio || 1, HERO_CONFIG.render.maxPixelRatio));

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'hero__labels-layer';
  container.append(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  scene.fog = new THREE.Fog(BACKGROUND, 18, 38);

  const camera = new THREE.PerspectiveCamera(
    HERO_CONFIG.camera.fieldOfView,
    1,
    HERO_CONFIG.camera.near,
    HERO_CONFIG.camera.far,
  );
  camera.position.set(0, 0.12, HERO_CONFIG.camera.positionZ);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0x8bdcff, 0x091021, 1.2));

  const keyLight = new THREE.DirectionalLight(0xb7d9ff, 1.8);
  keyLight.position.set(-4, 6, 8);
  scene.add(keyLight);

  const warmLight = new THREE.PointLight(0x69d8ef, 4, 10, 2);
  warmLight.position.set(0, 0, 2.5);
  scene.add(warmLight);

  // Floor grid
  const floor = new THREE.GridHelper(40, 40, 0x4dcce6, 0x143c4f);
  floor.position.set(0, -2.2, -10);
  floor.material = new THREE.LineBasicMaterial({
    color: 0x22627a,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  scene.add(floor);

  // Core Neural Sphere (Central AI nucleus)
  const coreGroup = new THREE.Group();
  coreGroup.name = 'Core Nucleus';
  const coreGeo = new THREE.SphereGeometry(0.85, 24, 20);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x53d9f2,
    emissive: 0x53d9f2,
    emissiveIntensity: 0.35,
    wireframe: true,
    transparent: true,
    opacity: 0.75,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreGroup.add(coreMesh);

  // Inner pulsing light
  const innerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 12),
    makeSurface(0x69d8ef, 0.6),
  );
  coreGroup.add(innerSphere);
  scene.add(coreGroup);

  // Concept satellites root
  const satellitesGroup = new THREE.Group();
  scene.add(satellitesGroup);

  // Distant particle field
  const particleCount = isMobile ? 60 : 180;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    particlePos[i] = (Math.random() - 0.5) * 20;
    particlePos[i + 1] = (Math.random() - 0.5) * 10;
    particlePos[i + 2] = 4 - Math.random() * 28;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x7be2f5,
    size: 0.04,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  scene.add(new THREE.Points(particleGeo, particleMat));

  // State management for interaction & animation
  const motionState = {
    targetX: 0,
    targetY: 0,
    cameraX: 0,
    cameraY: 0,
    frameId: 0,
    lastTime: 0,
    isPaused: false,
    disposed: false,
  };

  function rebuildSatellites(profile: CompanyProfile) {
    // Clear old satellites
    while (satellitesGroup.children.length > 0) {
      const child = satellitesGroup.children[0];
      satellitesGroup.remove(child);
      child.traverse((obj) => {
        if ('geometry' in obj) (obj as THREE.Mesh).geometry.dispose();
      });
    }

    const maxItems = isMobile ? 2 : 4;
    const selectedConcepts = CONCEPTS.slice(0, maxItems);
    const variant = profile.visualTheme.variant;

    selectedConcepts.forEach((concept, index) => {
      const group = new THREE.Group();
      group.name = concept.name;
      group.position.copy(concept.position);
      group.userData.baseZ = concept.position.z;
      group.userData.baseX = concept.position.x;
      group.userData.speed = 0.4 + index * 0.12;
      group.userData.phase = index * 1.5;

      let geo: THREE.BufferGeometry;

      // Adapt geometry emphasis by variant
      if (variant === 'volumes') {
        // Architecture & design emphasis: Box / Prism
        geo = new THREE.BoxGeometry(0.72, 0.72, 0.72);
      } else if (variant === 'nodes') {
        // Industry & construction: Octahedron / Spheres
        geo = new THREE.OctahedronGeometry(0.65, 0);
      } else if (variant === 'planes') {
        // Real estate & hospitality & marketing: Thin display slab
        geo = new THREE.BoxGeometry(1.2, 0.68, 0.08);
      } else {
        // Mixed default: alternating forms
        geo = index % 2 === 0
          ? new THREE.BoxGeometry(0.7, 0.7, 0.7)
          : new THREE.OctahedronGeometry(0.6, 0);
      }

      const mat = makeSurface(concept.color, 0.3);
      const mesh = new THREE.Mesh(geo, mat);
      group.add(mesh);

      const labelObj = createSceneLabel(concept.name, `0${index + 1}`);
      labelObj.position.set(0, 0.65, 0);
      group.add(labelObj);

      // Connecting subtle line to center
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        concept.position.clone().multiplyScalar(-0.4),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: concept.color,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      group.add(new THREE.Line(lineGeo, lineMat));

      satellitesGroup.add(group);
    });
  }

  // Animation tick
  function tick(now: number) {
    if (motionState.disposed || motionState.isPaused) return;

    const deltaMs = motionState.lastTime === 0 ? 16.67 : Math.min(now - motionState.lastTime, HERO_CONFIG.motion.maxDeltaMs);
    motionState.lastTime = now;

    if (!isReducedMotion) {
      motionState.cameraX = smoothToward(
        motionState.cameraX,
        motionState.targetX,
        deltaMs,
        HERO_CONFIG.motion.timeConstantMs,
        HERO_CONFIG.motion.maxDeltaMs,
      );
      motionState.cameraY = smoothToward(
        motionState.cameraY,
        motionState.targetY,
        deltaMs,
        HERO_CONFIG.motion.timeConstantMs,
        HERO_CONFIG.motion.maxDeltaMs,
      );
    }

    camera.position.x = motionState.cameraX * HERO_CONFIG.camera.travelX;
    camera.position.y = 0.12 + motionState.cameraY * HERO_CONFIG.camera.travelY;

    // Rotate core slowly
    const seconds = now / 1000;
    coreGroup.rotation.y = seconds * 0.2;
    coreGroup.rotation.x = Math.sin(seconds * 0.15) * 0.1;

    // Orbit satellites
    satellitesGroup.children.forEach((child) => {
      const { baseZ, speed, phase } = child.userData;
      if (typeof baseZ === 'number') {
        child.position.z = baseZ + Math.sin(seconds * speed + phase) * 0.18;
      }
      child.rotation.y = seconds * 0.3;
    });

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);

    motionState.frameId = requestAnimationFrame(tick);
  }

  function handlePointer(event: PointerEvent) {
    if (isReducedMotion || event.pointerType === 'touch') return;
    const bounds = container.getBoundingClientRect();
    const pointer = normalizePointer(event.clientX, event.clientY, bounds);
    motionState.targetX = applyDeadZone(pointer.x, HERO_CONFIG.motion.deadZone);
    motionState.targetY = applyDeadZone(pointer.y, HERO_CONFIG.motion.deadZone);
  }

  function handlePointerLeave() {
    motionState.targetX = 0;
    motionState.targetY = 0;
  }

  container.addEventListener('pointermove', handlePointer);
  container.addEventListener('pointerleave', handlePointerLeave);

  // IntersectionObserver to suspend animation when hero is off-screen
  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (motionState.isPaused) {
            motionState.isPaused = false;
            motionState.lastTime = performance.now();
            motionState.frameId = requestAnimationFrame(tick);
          }
        } else {
          motionState.isPaused = true;
          if (motionState.frameId) cancelAnimationFrame(motionState.frameId);
          motionState.frameId = 0;
        }
      }
    },
    { threshold: 0.05 },
  );
  intersectionObserver.observe(container);

  // Tab visibility
  const onVisibilityChange = () => {
    if (document.hidden) {
      motionState.isPaused = true;
      if (motionState.frameId) cancelAnimationFrame(motionState.frameId);
    } else if (!motionState.disposed) {
      motionState.isPaused = false;
      motionState.lastTime = performance.now();
      motionState.frameId = requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Initial render
  const initialRect = container.getBoundingClientRect();
  if (initialRect.width > 0 && initialRect.height > 0) {
    camera.aspect = initialRect.width / initialRect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(initialRect.width, initialRect.height, false);
    labelRenderer.setSize(initialRect.width, initialRect.height);
  }

  motionState.frameId = requestAnimationFrame(tick);

  return {
    canvas,
    updateProfile(profile) {
      rebuildSatellites(profile);
      if (profile.visualTheme.accentColor) {
        const color = new THREE.Color(profile.visualTheme.accentColor);
        coreMat.color = color;
        coreMat.emissive = color;
      }
      if (isReducedMotion) {
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      }
    },
    resize(width, height) {
      if (motionState.disposed || width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const scale = width < HERO_CONFIG.render.mobileBreakpoint
        ? 0.55
        : width < HERO_CONFIG.render.tabletBreakpoint
          ? 0.8
          : 1;

      satellitesGroup.children.forEach((child) => {
        child.position.x = Number(child.userData.baseX) * scale;
      });

      renderer.setSize(width, height, false);
      labelRenderer.setSize(width, height);
    },
    render() {
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    },
    pause() {
      motionState.isPaused = true;
      if (motionState.frameId) cancelAnimationFrame(motionState.frameId);
    },
    resume() {
      if (motionState.isPaused && !motionState.disposed) {
        motionState.isPaused = false;
        motionState.lastTime = performance.now();
        motionState.frameId = requestAnimationFrame(tick);
      }
    },
    dispose() {
      if (motionState.disposed) return;
      motionState.disposed = true;
      if (motionState.frameId) cancelAnimationFrame(motionState.frameId);
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      container.removeEventListener('pointermove', handlePointer);
      container.removeEventListener('pointerleave', handlePointerLeave);
      labelRenderer.domElement.remove();

      scene.traverse((obj) => {
        if ('geometry' in obj) (obj as THREE.Mesh).geometry.dispose();
      });
      renderer.dispose();
    },
  };
}
