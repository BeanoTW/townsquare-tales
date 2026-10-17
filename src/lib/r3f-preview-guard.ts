import * as THREE from "three";

/**
 * Lovable may add the dashed prop data-tsd-source to R3F host elements.
 * R3F treats it as the nested path object.data.tsd.source, not as a DOM
 * data attribute. Supplying only object.data (the old fix) still throws at
 * the missing 'tsd' object. Give renderer-owned Three objects the full path.
 *
 * Confine this compatibility layer to Three classes, never Object.prototype.
 */
export function installR3FPreviewMetadataGuard(): void {
  const classes = [THREE.Object3D, THREE.Material, THREE.BufferGeometry, THREE.Texture] as const;
  for (const cls of classes) {
    const proto = cls.prototype;
    if (Object.getOwnPropertyDescriptor(proto, "data")) continue;
    Object.defineProperty(proto, "data", {
      configurable: true,
      get(this: { userData?: Record<string, unknown> }) {
        if (!this.userData) this.userData = {};
        const userData = this.userData;
        if (!userData.tsd || typeof userData.tsd !== "object") userData.tsd = {};
        return userData;
      },
    });
  }
}
