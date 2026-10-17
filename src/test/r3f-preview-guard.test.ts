import {describe,it,expect} from "vitest";
import * as THREE from "three";
import {installR3FPreviewMetadataGuard} from "@/lib/r3f-preview-guard";
describe("Lovable editor metadata and R3F",()=>{
 it("provides an object-backed data path on Three scene primitives",()=>{
  installR3FPreviewMetadataGuard();
  for(const item of [new THREE.Group(),new THREE.Mesh(),new THREE.MeshStandardMaterial(),new THREE.BufferGeometry(),new THREE.Texture()]){
   const node=item as unknown as {data:Record<string,string>;userData:Record<string,string>};
   node.data["tsd-source"]="src/test.tsx:4";
   expect(node.userData["tsd-source"]).toBe("src/test.tsx:4");
  }
 });
 it("remains idempotent and does not touch ordinary objects",()=>{
  installR3FPreviewMetadataGuard();installR3FPreviewMetadataGuard();
  expect(Object.prototype.hasOwnProperty("data")).toBe(false);
 });
});
