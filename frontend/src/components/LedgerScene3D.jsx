import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

function LedgerScene3D({ disabled = false }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;

    if (!host || disabled) {
      return undefined;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "ledger-scene-3d__canvas";
    host.appendChild(canvas);

    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new Scene();
    scene.fog = new Fog(0xf4f7fb, 8, 24);

    const camera = new PerspectiveCamera(46, 1, 0.1, 60);
    camera.position.set(0, 0.85, 11);

    const ambientLight = new AmbientLight(0xffffff, 1.2);
    const keyLight = new DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(3.8, 4.8, 5.4);
    const rimLight = new DirectionalLight(0x7fb1ff, 0.82);
    rimLight.position.set(-5, 2.5, -2);
    scene.add(ambientLight, keyLight, rimLight);

    const field = new Group();
    field.rotation.x = -0.17;
    field.rotation.z = -0.015;
    scene.add(field);

    const plateGeometry = new BoxGeometry(1.38, 0.035, 0.72);
    const plateMaterial = new MeshStandardMaterial({
      color: 0x5f83e7,
      emissive: 0x14388a,
      emissiveIntensity: 0.08,
      metalness: 0.28,
      roughness: 0.36,
      transparent: true,
      opacity: 0.16,
    });
    const plateCount = 42;
    const plates = new InstancedMesh(plateGeometry, plateMaterial, plateCount);
    const dummy = new Object3D();

    for (let index = 0; index < plateCount; index += 1) {
      const row = Math.floor(index / 7);
      const column = index % 7;
      const rowShift = row % 2 === 0 ? 0 : 0.52;

      dummy.position.set(
        (column - 3) * 1.38 + rowShift,
        1.55 - row * 0.58,
        -row * 0.62
      );
      dummy.rotation.set(
        -0.06 + row * 0.004,
        (column - 3) * 0.018,
        (column % 2 === 0 ? 1 : -1) * 0.018
      );
      const scale = 0.92 + ((row + column) % 4) * 0.035;
      dummy.scale.set(scale, 1, scale);
      dummy.updateMatrix();
      plates.setMatrixAt(index, dummy.matrix);
    }
    field.add(plates);

    const accentMaterial = new MeshStandardMaterial({
      color: 0x34b77a,
      emissive: 0x0f8a5f,
      emissiveIntensity: 0.2,
      metalness: 0.18,
      roughness: 0.42,
      transparent: true,
      opacity: 0.22,
    });
    const accentPlates = new InstancedMesh(plateGeometry, accentMaterial, 10);

    for (let index = 0; index < 10; index += 1) {
      const row = index + 1;
      const column = index % 5;

      dummy.position.set(
        (column - 2) * 1.55 + 0.35,
        1.34 - row * 0.48,
        -row * 0.72 - 0.28
      );
      dummy.rotation.set(-0.08, (column - 2) * 0.025, -0.012);
      dummy.scale.set(0.62, 1, 0.7);
      dummy.updateMatrix();
      accentPlates.setMatrixAt(index, dummy.matrix);
    }
    field.add(accentPlates);

    const railPositions = [];

    for (let row = 0; row < 9; row += 1) {
      const y = 1.72 - row * 0.55;
      const z = -row * 0.58 - 0.08;
      railPositions.push(-4.9, y, z, 4.9, y, z);
    }

    for (let column = 0; column < 8; column += 1) {
      const x = -4.75 + column * 1.35;
      railPositions.push(x, 1.9, 0.02, x + 0.62, -3.05, -5.25);
    }

    const railGeometry = new BufferGeometry();
    railGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(railPositions, 3)
    );
    const railMaterial = new LineBasicMaterial({
      color: 0x2458d3,
      transparent: true,
      opacity: 0.18,
    });
    const rails = new LineSegments(railGeometry, railMaterial);
    field.add(rails);

    const pointer = { x: 0, y: 0 };
    let pulse = 0;
    let scrollY = window.scrollY;
    let frameId = 0;

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      const safeWidth = Math.max(1, width);
      const safeHeight = Math.max(1, height);

      camera.aspect = safeWidth / safeHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(safeWidth, safeHeight, false);
    };

    const handlePointerMove = (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleClick = () => {
      pulse = 1;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const render = (time = 0) => {
      const elapsed = time * 0.001;
      const scrollInfluence = Math.min(scrollY / 1400, 1);

      pulse *= 0.92;
      field.rotation.y += (pointer.x * 0.15 - field.rotation.y) * 0.055;
      field.rotation.x += (-0.17 + pointer.y * 0.055 - field.rotation.x) * 0.055;
      field.position.y = Math.sin(elapsed * 0.32) * 0.08 - scrollInfluence * 0.18;
      field.position.x += (pointer.x * 0.1 - field.position.x) * 0.04;
      field.scale.setScalar(1 + pulse * 0.012);

      plateMaterial.opacity = 0.13 + Math.sin(elapsed * 0.7) * 0.018 + pulse * 0.035;
      accentMaterial.opacity = 0.2 + Math.sin(elapsed * 0.9) * 0.018 + pulse * 0.04;
      railMaterial.opacity = 0.13 + Math.sin(elapsed * 0.46) * 0.025 + pulse * 0.05;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(render);

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("click", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);

      field.remove(plates, accentPlates, rails);
      plateGeometry.dispose();
      plateMaterial.dispose();
      accentMaterial.dispose();
      railGeometry.dispose();
      railMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [disabled]);

  return <div ref={hostRef} className="ledger-scene-3d" aria-hidden="true" />;
}

export default LedgerScene3D;
