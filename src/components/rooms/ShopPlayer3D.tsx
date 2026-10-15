import { Component, useEffect, useMemo, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Person } from "@/components/Character3D";
import { townColor } from "@/components/town3d/palette";
import { shopPlayerClipMatrix } from "@/lib/player-appearance";

export type ShopPlayerPose = { x: number; y: number; angle: number; phase: number; moving: boolean };
type Props = { player: ShopPlayerPose; head: string; onReady: () => void; onFail: () => void };

class Boundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { this.props.onFail(); }
  override render() { return this.state.failed ? null : this.props.children; }
}

function Figure({ player, head, onReady }: Omit<Props, "onFail">) {
  const { invalidate } = useThree();
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => { invalidate(); }, [player, head, invalidate]);
  useFrame(({ camera, size }) => {
    camera.position.set(0, 0, 0);
    camera.quaternion.identity();
    camera.updateMatrixWorld(true);
    camera.projectionMatrix.fromArray(shopPlayerClipMatrix(size.width, size.height));
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }, -2);
  return <>
    <hemisphereLight args={["#eef4fb", "#9a8a72", 1.5]} />
    <directionalLight position={[-3, 8, 4]} intensity={2} />
    <Person skin={head} outfit={townColor("var(--town-player)")} scale={3}
      get={() => ({ x: player.x, z: player.y, angle: player.angle, phase: player.phase, walking: player.moving, visible: true, pose: "standing" })} />
  </>;
}

/** Transparent character canvas aligned to the shop SVG's 432 × 360 'meet' viewBox. */
export default function ShopPlayer3D(props: Props) {
  const camera = useMemo(() => Object.assign(new THREE.OrthographicCamera(), { manual: true }), []);
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-shop-player-3d>
    <Boundary onFail={props.onFail}>
      <Canvas camera={camera} frameloop="demand" dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <Figure player={props.player} head={props.head} onReady={props.onReady} />
      </Canvas>
    </Boundary>
  </div>;
}
