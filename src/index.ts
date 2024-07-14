import Renderer from './renderer';
import { createInputHandler } from './input';
import { OrbitCamera } from './camera';
import { vec3 } from 'wgpu-matrix';

const canvas = document.getElementById('gfx') as HTMLCanvasElement;

const camera = new OrbitCamera({ 
    position: vec3.create(3, 5, 5), 
    inputHandler: createInputHandler(canvas)
});

const renderer = new Renderer(canvas, camera);

renderer.start();


