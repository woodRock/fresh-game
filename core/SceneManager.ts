import { GameConfig } from "../config/GameConfig.ts";
import { Colors } from "../config/Colors.ts";

export class SceneManager {
  scene: any;
  camera: any;
  renderer: any;
  cubeContainer: any;
  cube: any;
  mazes: any;
  THREE: any;
  
  constructor(mountElement: HTMLElement, THREE: any) {
    this.THREE = THREE;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(Colors.background);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 25);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    mountElement.appendChild(this.renderer.domElement);
    
    // Create a container for the cube
    this.cubeContainer = new THREE.Object3D();
    this.scene.add(this.cubeContainer);
    
    // Create cube with materials
    const cubeGeometry = new THREE.BoxGeometry(
      GameConfig.cubeSize, 
      GameConfig.cubeSize,
      GameConfig.cubeSize
    );
    
    // Face materials
    const faceMaterials = [
      new THREE.MeshStandardMaterial({ color: Colors.faces.right, roughness: 0.8 }),  // right
      new THREE.MeshStandardMaterial({ color: Colors.faces.left, roughness: 0.8 }),   // left
      new THREE.MeshStandardMaterial({ color: Colors.faces.top, roughness: 0.8 }),    // top
      new THREE.MeshStandardMaterial({ color: Colors.faces.bottom, roughness: 0.8 }), // bottom
      new THREE.MeshStandardMaterial({ color: Colors.faces.front, roughness: 0.8 }),  // front
      new THREE.MeshStandardMaterial({ color: Colors.faces.back, roughness: 0.8 })    // back
    ];
    
    this.cube = new THREE.Mesh(cubeGeometry, faceMaterials);
    this.cube.receiveShadow = true;
    this.cubeContainer.add(this.cube);
    
    // Create placeholder mazes
    this.mazes = {
      top: [],
      bottom: [],
      left: [],
      right: [],
      front: [],
      back: []
    };
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Handle window resize
    window.addEventListener("resize", this.handleResize.bind(this));
  }
  
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  render(camera = this.camera) {
    this.renderer.render(this.scene, camera);
  }
  
  dispose() {
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.renderer.dispose();
  }
}