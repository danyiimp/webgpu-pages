import Renderer from './renderer';
import { createInputHandler } from './input';
import { OrbitCamera } from './camera';
import { getRandomTransformMatrix, RenderObject, RenderObjectBase } from './renderable';
import { vec3 } from 'wgpu-matrix';
import { createAxesMesh, createSphereMesh, createTetrahedronMesh, Mesh } from './mesh';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;

const camera = new OrbitCamera({ 
    position: vec3.create(1, 1, 1), 
    inputHandler: createInputHandler(canvas)
});

const rendererObjects: RenderObject[] = [];

let mesh: Mesh = createAxesMesh();
for (let i = 0; i < 80; i++) {
    const transform = getRandomTransformMatrix();
    const object = new RenderObjectBase(mesh, transform); 
    
    rendererObjects.push(object)
}

mesh = createTetrahedronMesh();
for (let i = 0; i < 10; i++) {
    const transform = getRandomTransformMatrix();
    const object = new RenderObjectBase(mesh, transform); 
    
    rendererObjects.push(object)
}

mesh = createSphereMesh(0.5)
for (let i = 0; i < 10; i++) {
    const transform = getRandomTransformMatrix();
    const object = new RenderObjectBase(mesh, transform); 
    
    rendererObjects.push(object)
}

const renderer = new Renderer(canvas, camera, rendererObjects);

renderer.start();


