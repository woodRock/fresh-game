// entities/Cube.ts - Cube entity with face materials
import * as THREE from 'npm:three';
import { GameConfig } from '../config/GameConfig.ts';
import { Colors } from '../config/Colors.ts';
import { FaceName } from '../utils/FaceUtils.ts';

export class Cube {
  mesh: THREE.Mesh;
  container: THREE.Object3D;
  
  constructor() {
    // Create container for the cube
    this.container = new THREE.Object3D();
    
    // Create cube geometry
    const cubeGeometry = new THREE.BoxGeometry(
      GameConfig.cubeSize, 
      GameConfig.cubeSize, 
      GameConfig.cubeSize
    );
    
    // Create materials for each face
    const faceMaterials = [
      new THREE.MeshStandardMaterial({ color: Colors.faces.right, roughness: 0.8 }), // right
      new THREE.MeshStandardMaterial({ color: Colors.faces.left, roughness: 0.8 }),  // left
      new THREE.MeshStandardMaterial({ color: Colors.faces.top, roughness: 0.8 }),   // top
      new THREE.MeshStandardMaterial({ color: Colors.faces.bottom, roughness: 0.8 }), // bottom
      new THREE.MeshStandardMaterial({ color: Colors.faces.front, roughness: 0.8 }),  // front
      new THREE.MeshStandardMaterial({ color: Colors.faces.back, roughness: 0.8 })    // back
    ];
    
    // Create the cube mesh
    this.mesh = new THREE.Mesh(cubeGeometry, faceMaterials);
    this.mesh.receiveShadow = true;
    
    // Add mesh to container
    this.container.add(this.mesh);
  }
  
  /**
   * Add an object as a child of the cube mesh
   */
  addChild(object: THREE.Object3D): void {
    this.mesh.add(object);
  }
  
  /**
   * Update the world matrix of the cube container
   */
  updateMatrix(): void {
    this.container.updateMatrixWorld();
  }
  
  /**
   * Get the world-to-local matrix transform
   */
  getLocalMatrix(): THREE.Matrix4 {
    this.updateMatrix();
    return this.container.matrixWorld.clone().invert();
  }
  
  /**
   * Transform a world position to cube-local position
   */
  worldToLocal(position: THREE.Vector3): THREE.Vector3 {
    const localMatrix = this.getLocalMatrix();
    return position.clone().applyMatrix4(localMatrix);
  }
  
  /**
   * Transform a local position to world position
   */
  localToWorld(position: THREE.Vector3): THREE.Vector3 {
    this.updateMatrix();
    return position.clone().applyMatrix4(this.container.matrixWorld);
  }
}

