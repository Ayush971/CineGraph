import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import * as THREE from "three";

/**
 * The landing hero: a slowly drifting cylinder of real movie posters.
 * Lazy-loaded (three.js stays out of the main bundle) and only mounted on
 * desktop + fine pointer + no reduced-motion + WebGL available.
 */

interface PosterWall3DProps {
  posterUrls: string[];
}

const RADIUS = 7;
const COLS = 16;
const ROWS = 3;
const ROW_GAP = 3.5;
const PLANE_W = 2.1;
const PLANE_H = 3.15;
const DRIFT_SPEED = 0.04; // rad/s — one revolution ≈ 2.5 min

function Ring({ textures }: { textures: THREE.Texture[] }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Slow reel drift
    group.current.rotation.y += delta * DRIFT_SPEED;
    // Gentle tilt toward the cursor
    group.current.rotation.x +=
      (mouse.current.y * 0.05 - group.current.rotation.x) * 0.04;
    // Camera parallax
    camera.position.x += (mouse.current.x * 0.7 - camera.position.x) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  const planes = useMemo(() => {
    const arr: {
      pos: [number, number, number];
      rotY: number;
      tex: THREE.Texture;
    }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        // Brick-pattern: offset alternate rows by half a column
        const angle =
          (c / COLS) * Math.PI * 2 + (r % 2 === 1 ? Math.PI / COLS : 0);
        arr.push({
          pos: [
            Math.sin(angle) * RADIUS,
            (r - (ROWS - 1) / 2) * ROW_GAP,
            Math.cos(angle) * RADIUS,
          ],
          rotY: angle,
          tex: textures[(r * COLS + c) % textures.length],
        });
      }
    }
    return arr;
  }, [textures]);

  return (
    <group ref={group}>
      {planes.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, p.rotY, 0]}>
          <planeGeometry args={[PLANE_W, PLANE_H]} />
          {/* Dimmed so hero copy stays legible; DoubleSide shows the far
              side of the reel through the gaps for depth */}
          <meshBasicMaterial
            map={p.tex}
            color="#8a8a8a"
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

const PosterWall3D: React.FC<PosterWall3DProps> = ({ posterUrls }) => {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    Promise.all(
      posterUrls.map(
        (url) =>
          new Promise<THREE.Texture | null>((resolve) => {
            loader.load(
              url,
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                resolve(tex);
              },
              undefined,
              () => resolve(null) // failed posters are simply skipped
            );
          })
      )
    ).then((list) => {
      if (!cancelled) {
        setTextures(list.filter((t): t is THREE.Texture => t !== null));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [posterUrls]);

  // Not enough imagery for a convincing wall — parent's fallback stays visible.
  if (!textures || textures.length < 8) return null;

  return (
    <motion.div
      className="absolute inset-0"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 12.5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <fog attach="fog" args={["#0b0a0a", 9, 22]} />
        <Ring textures={textures} />
      </Canvas>
    </motion.div>
  );
};

export default PosterWall3D;
