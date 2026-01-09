import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f14);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
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

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x22222a, roughness: 0.9, metalness: 0.0 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const texture = new THREE.TextureLoader().load('/textures/wood.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

const box = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 1.6, 1.6),
  new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0.0 })
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
  new THREE.MeshStandardMaterial({ color: 0x44aa88, roughness: 0.5, metalness: 0.1 })
);
pyramid.position.set(3, 0.0, 1);
pyramid.castShadow = true;
pyramid.receiveShadow = true;
scene.add(pyramid);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.9, 32, 16),
  new THREE.MeshStandardMaterial({ color: 0x6688ff, roughness: 0.2, metalness: 0.3 })
);
sphere.position.set(-3, 0.9, 2);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

const selectableRoots = [];

let selected = null;

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

const transform = new TransformControls(camera, renderer.domElement);

const transformHelper = transform.getHelper();
scene.add(transformHelper);

transform.setSize(1.5);         
transform.setSpace('world');     
transform.visible = true;

transformHelper.traverse((obj) => {
  obj.renderOrder = 9999;
  if (obj.material) {
    obj.material.depthTest = false;
    obj.material.depthWrite = false;
    obj.material.transparent = true;
  }
});

transform.addEventListener('dragging-changed', (e) => {
  controls.enabled = !e.value;
});

transform.addEventListener('objectChange', () => {
  updateTransformInputsFromSelected();
});

const gltfLoader = new GLTFLoader();

let modelCounter = 1;

function loadModelFromFile(file) {
  const name = file.name || `model-${modelCounter}`;
  const url = URL.createObjectURL(file);

  gltfLoader.load(
    url,
    (gltf) => {
      URL.revokeObjectURL(url);

      const root = gltf.scene;

      root.name = name || `Модель ${modelCounter}`;
      modelCounter += 1;

      root.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      root.position.set(0, 0.0, -3);

      scene.add(root);
      selectableRoots.push(root);

      setSelected(root);
    },
    undefined,
    (err) => {
      URL.revokeObjectURL(url);
      console.error('Ошибка загрузки модели:', err);
      alert('Не удалось загрузить модель. Проверьте формат (.glb/.gltf)');
    }
  );
}

// input[type="file"]
const modelFileInput = document.querySelector('#modelFile');
modelFileInput.addEventListener('change', () => {
  const file = modelFileInput.files?.[0];
  if (!file) return;

  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
    alert('Пожалуйста, выбери файл .glb или .gltf');
    modelFileInput.value = '';
    return;
  }

  loadModelFromFile(file);

  modelFileInput.value = '';
});

// drag-n-drop на весь документ
renderer.domElement.addEventListener('dragover', (e) => {
  e.preventDefault();
});

renderer.domElement.addEventListener('drop', (e) => {
  e.preventDefault();

  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
    alert('Перетаскивай файлы .glb или .gltf');
    return;
  }

  loadModelFromFile(file);
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (transform.dragging) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

  raycaster.setFromCamera(pointerNDC, camera);

  const intersects = raycaster.intersectObjects(selectableRoots, true);

  if (intersects.length === 0) {
    setSelected(null);
    return;
  }

  const hitObject = intersects[0].object;
  const root = getRootSelectable(hitObject);

  setSelected(root);
});

function getRootSelectable(obj) {
  let current = obj;
  while (current) {
    if (selectableRoots.includes(current)) return current;
    current = current.parent;
  }
  return null;
}

const btnTranslate = document.querySelector('#modeTranslate');
const btnRotate = document.querySelector('#modeRotate');
const btnScale = document.querySelector('#modeScale');

function setMode(mode) {
  transform.setMode(mode);

  btnTranslate.classList.toggle('active', mode === 'translate');
  btnRotate.classList.toggle('active', mode === 'rotate');
  btnScale.classList.toggle('active', mode === 'scale');
}

btnTranslate.addEventListener('click', () => setMode('translate'));
btnRotate.addEventListener('click', () => setMode('rotate'));
btnScale.addEventListener('click', () => setMode('scale'));

setMode('translate');

const selectedNameEl = document.querySelector('#selectedName');

const posX = document.querySelector('#posX');
const posY = document.querySelector('#posY');
const posZ = document.querySelector('#posZ');

const rotX = document.querySelector('#rotX');
const rotY = document.querySelector('#rotY');
const rotZ = document.querySelector('#rotZ');

const sclX = document.querySelector('#sclX');
const sclY = document.querySelector('#sclY');
const sclZ = document.querySelector('#sclZ');

let isSyncingInputs = false;

function setInputsEnabled(enabled) {
  for (const el of [posX,posY,posZ, rotX,rotY,rotZ, sclX,sclY,sclZ]) {
    el.disabled = !enabled;
  }
}

setInputsEnabled(false);

function updateTransformInputsFromSelected() {
  if (!selected) return;

  isSyncingInputs = true;

  posX.value = selected.position.x.toFixed(2);
  posY.value = selected.position.y.toFixed(2);
  posZ.value = selected.position.z.toFixed(2);

  rotX.value = THREE.MathUtils.radToDeg(selected.rotation.x).toFixed(0);
  rotY.value = THREE.MathUtils.radToDeg(selected.rotation.y).toFixed(0);
  rotZ.value = THREE.MathUtils.radToDeg(selected.rotation.z).toFixed(0);

  sclX.value = selected.scale.x.toFixed(2);
  sclY.value = selected.scale.y.toFixed(2);
  sclZ.value = selected.scale.z.toFixed(2);

  isSyncingInputs = false;
}

function applyTransformFromInputs() {
  if (!selected) return;
  if (isSyncingInputs) return;

  selected.position.set(
    Number(posX.value) || 0,
    Number(posY.value) || 0,
    Number(posZ.value) || 0
  );

  selected.rotation.set(
    THREE.MathUtils.degToRad(Number(rotX.value) || 0),
    THREE.MathUtils.degToRad(Number(rotY.value) || 0),
    THREE.MathUtils.degToRad(Number(rotZ.value) || 0)
  );

  const sx = Math.max(0.01, Number(sclX.value) || 1);
  const sy = Math.max(0.01, Number(sclY.value) || 1);
  const sz = Math.max(0.01, Number(sclZ.value) || 1);
  selected.scale.set(sx, sy, sz);

  transform.updateMatrixWorld();
}

for (const el of [posX,posY,posZ, rotX,rotY,rotZ, sclX,sclY,sclZ]) {
  el.addEventListener('input', applyTransformFromInputs);
}

function setSelected(obj) {
  selected = obj;

  if (!selected) {
    transform.detach();
    selectedNameEl.textContent = 'ничего';
    setInputsEnabled(false);
    return;
  }

  transform.attach(selected);

  const b = new THREE.Box3().setFromObject(selected);
  const size = new THREE.Vector3();
  b.getSize(size);

  const maxSize = Math.max(size.x, size.y, size.z) || 1;
  transform.setSize(Math.min(3, Math.max(0.7, maxSize * 0.15)));

  transformHelper.updateMatrixWorld(true);

  selectedNameEl.textContent = selected.name || 'модель';
  setInputsEnabled(true);
  updateTransformInputsFromSelected();
}

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
