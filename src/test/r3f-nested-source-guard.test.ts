import {describe,it,expect} from "vitest";
import * as THREE from "three";
import {installR3FPreviewMetadataGuard} from "@/lib/r3f-preview-guard";
describe("Lovable nested data-tsd-source R3F guard",()=>{
 it("provides the entire data.tsd.source path on Three.js primitives",()=>{
  installR3FPreviewMetadataGuard();
  for(const item of [new THREE.Group(),new THREE.Mesh(),new THREE.MeshStandardMaterial(),new THREE.BufferGeometry(),new THREE.Texture()]){
   const node=item as unknown as {data:{tsd:{source?:string}};userData:{tsd:{source?:string}}};
   node.data.tsd.source="src/scene.tsx:24";
   expect(node.userData.tsd.source).toBe("src/scene.tsx:24");
  }
 });
 it("preserves preexisting metadata and repeated initialization",()=>{
  installR3FPreviewMetadataGuard();installR3FPreviewMetadataGuard();
  const obj=new THREE.Group();obj.userData.tsd={source:"original"};
  expect((obj as unknown as {data:{tsd:{source:string}}}).data.tsd.source).toBe("original");
  expect(Object.prototype.hasOwnProperty("data")).toBe(false);
 });
});
