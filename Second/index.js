import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js"
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 5;

const scene = new THREE.Scene();

const venusGroup = new THREE.Group();
scene.add(venusGroup);

venusGroup.rotation.z = -23.4 * Math.PI / 180;
const controls = new OrbitControls(camera, renderer.domElement);
const loader = new THREE.TextureLoader();

const geo = new THREE.IcosahedronGeometry(1, 12);
const mat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    map: loader.load("venusmap.jpg")
});
const venusMesh = new THREE.Mesh(geo, mat);
venusGroup.add(venusMesh);

const venusMat = new THREE.MeshBasicMaterial({
    map: loader.load("venusbump.jpg"),
    blending: THREE.AdditiveBlending
});
const newMesh = new THREE.Mesh(geo, venusMat);
venusGroup.add(newMesh);

const sunLight = new THREE.DirectionalLight(0xffffff);
sunLight.position.set(-2, 0.5, 1);
scene.add(sunLight);


function animate(t = 0) {
    requestAnimationFrame(animate);
    venusGroup.rotation.y += 0.001;
    renderer.render(scene, camera);
}

animate();