import * as THREE from "three";

/**
 * Lovable's dev-only JSX source mapper can annotate R3F host primitives with
 * data-tsd-source. R3F interprets the dashed prop as a nested write through
 * object.data, and throws if no such object exists. Three.js already supplies
 * an object safe for editor annotations: userData.
 *
 * This compatibility alias is deliberately limited to Three.js prototypes,
 * never Object.prototype, and therefore cannot affect HTML or app state.
 */
export function installR3FPreviewMetadataGuard(): void {
  const classes = [THREE.Object3D, THREE.Material, THREE.BufferGeometry, THREE.Texture] as const;
  for (const cls of classes) {
    if (Object.getOwnPropertyDescriptor(cls.prototype, "data")) continue;
    Object.defineProperty(cls.prototype, "data", {
      configurable: true,
      get(this: {userData?:Record<string,unknown>}) {
        if (!this.userData) this.userData = {};
        return this.userData;
      },
    });
  }
}
