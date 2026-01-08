import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f14);


const camera = new THREE.PerspectiveCamera(
  60, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  200 
);

camera.position.set(6, 5, 8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0); 

const ambient = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(6, 10, 4);
dirLight.castShadow = true;

dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 40;
dirLight.shadow.camera.left = -12;
dirLight.shadow.camera.right = 12;
dirLight.shadow.camera.top = 12;
dirLight.shadow.camera.bottom = -12;

scene.add(dirLight);

const pointLight = new THREE.PointLight(0xff88aa, 1.2, 50);
pointLight.position.set(-4, 3, -2);
pointLight.castShadow = true;
pointLight.shadow.mapSize.set(1024, 1024);
scene.add(pointLight);

const bulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.08, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xff88aa })
);
bulb.position.copy(pointLight.position);
scene.add(bulb);

const floorGeo = new THREE.PlaneGeometry(20, 20);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x22222a,
  roughness: 0.9,
  metalness: 0.0
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2; 
floor.receiveShadow = true;     
scene.add(floor);

const texture = new THREE.TextureLoader().load('/textures/wood.jpg');

texture.colorSpace = THREE.SRGBColorSpace;

const box = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 1.6, 1.6),
  new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.0
  })
);
box.position.set(0, 1.1, 0);
box.castShadow = true;
box.receiveShadow = true;
scene.add(box);

function createTriPyramidGeometry() {
  const A = new THREE.Vector3(-1, 0, -1);
  const B = new THREE.Vector3(1, 0, -1);
  const C = new THREE.Vector3(0, 0, 1);

  const D = new THREE.Vector3(0, 1.8, 0);

  const vertices = new Float32Array([
    A.x, A.y, A.z,  B.x, B.y, B.z,  C.x, C.y, C.z,
    A.x, A.y, A.z,  B.x, B.y, B.z,  D.x, D.y, D.z,
    B.x, B.y, B.z,  C.x, C.y, C.z,  D.x, D.y, D.z,
    C.x, C.y, C.z,  A.x, A.y, A.z,  D.x, D.y, D.z,
  ]);

  const geo = new THREE.BufferGeometry();

  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  geo.computeVertexNormals();

  return geo;
}

const pyramid = new THREE.Mesh(
  createTriPyramidGeometry(),
  new THREE.MeshStandardMaterial({
    color: 0x44aa88,
    roughness: 0.5,
    metalness: 0.1
  })
);
pyramid.position.set(3, 0.0, 1);
pyramid.castShadow = true;
pyramid.receiveShadow = true;
scene.add(pyramid);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 16),
  new THREE.MeshStandardMaterial({
    color: 0x6688ff,
    roughness: 0.2,
    metalness: 0.3
  })
);
sphere.position.set(-3, 0.9, 2);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

const dirIntensityInput = document.querySelector('#dirIntensity');
const dirIntensityVal = document.querySelector('#dirIntensityVal');
dirIntensityInput.addEventListener('input', () => {
  const v = Number(dirIntensityInput.value);
  dirLight.intensity = v;
  dirIntensityVal.textContent = v.toFixed(2);
});

const pointColorInput = document.querySelector('#pointColor');
pointColorInput.addEventListener('input', () => {
  const c = new THREE.Color(pointColorInput.value);
  pointLight.color.copy(c);
  bulb.material.color.copy(c);
});

const objectColorInput = document.querySelector('#objectColor');
objectColorInput.addEventListener('input', () => {
  pyramid.material.color.set(objectColorInput.value);
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});


const clock = new THREE.Clock();

function animate() {
  const t = clock.getElapsedTime();

  box.rotation.y = t * 0.5;
  sphere.rotation.y = -t * 0.3;
  pyramid.rotation.y = t * 0.35;

  controls.update();

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

animate();
