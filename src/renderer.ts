import { mat4, vec3 } from "wgpu-matrix";

// import vertShaderCode from './shaders/triangle.vert.wgsl';
// import fragShaderCode from './shaders/triangle.frag.wgsl';
import vertShaderCode from './shaders/camera.vert.wgsl';
import fragShaderCode from './shaders/basic.frag.wgsl';
import Camera from "./camera";
import { RenderObject, RenderObjectBase } from "./renderable";

let lastFrameMS = Date.now();

export default class Renderer {
    canvas: HTMLCanvasElement;
    camera: Camera;

    // ⚙️ API Data Structures
    adapter: GPUAdapter;
    device: GPUDevice;
    queue: GPUQueue;

    // 🎞️ Frame Backings
    context: GPUCanvasContext;
    colorTexture: GPUTexture;
    colorTextureView: GPUTextureView;
    depthTexture: GPUTexture;
    depthTextureView: GPUTextureView;

    renderObjects: RenderObject[];
    uniformBuffer: GPUBuffer;

    vertModule: GPUShaderModule;
    fragModule: GPUShaderModule;

    commandEncoder: GPUCommandEncoder;
    passEncoder: GPURenderPassEncoder;

    constructor(canvas: HTMLCanvasElement, camera: Camera, renderObjects: RenderObject[]) {
        this.canvas = canvas;
        this.camera = camera;
        this.renderObjects = renderObjects;
    }

    // 🏎️ Start the rendering engine
    async start() {
        if (await this.initializeAPI()) {
            this.resizeBackings();
            await this.initializeResources();

            const observer = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const width = entry.contentBoxSize[0].inlineSize;
                    const height = entry.contentBoxSize[0].blockSize;
                    this.canvas.width = Math.max(1, Math.min(width, this.device.limits.maxTextureDimension2D));
                    this.canvas.height = Math.max(1, Math.min(height, this.device.limits.maxTextureDimension2D));
                    this.resizeBackings()
                }
            });
            observer.observe(this.canvas);
            this.render();
        }
    }

    // 🌟 Initialize WebGPU
    async initializeAPI(): Promise<boolean> {
        try {
            // 🏭 Entry to WebGPU
            const entry: GPU = navigator.gpu;
            if (!entry) {
                return false;
            }

            // 🔌 Physical Device Adapter
            this.adapter = await entry.requestAdapter();

            // 💻 Logical Device
            this.device = await this.adapter.requestDevice();

            // 📦 Queue
            this.queue = this.device.queue;
        } catch (e) {
            console.error(e);
            return false;
        }

        return true;
    }

    async initializeResources() {
        const vsmDesc = {
            code: vertShaderCode
        };
        this.vertModule = this.device.createShaderModule(vsmDesc);

        const fsmDesc = {
            code: fragShaderCode
        };
        this.fragModule = this.device.createShaderModule(fsmDesc);

        
        const uniformBufferSize = 4 * 16; // 4x4 matrix
        this.uniformBuffer = this.device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        
        RenderObjectBase.initializeStatic(this.device, this.vertModule, this.fragModule, this.uniformBuffer);


        this.renderObjects.forEach(object => {
            object.initialize(this.device);
        });
    }

    // ↙️ Resize swapchain, frame buffer attachments
    resizeBackings() {
        // ⛓️ Swapchain
        if (!this.context) {
            this.context = this.canvas.getContext('webgpu');
            const canvasConfig: GPUCanvasConfiguration = {
                device: this.device,
                format: 'bgra8unorm',
                usage:
                    GPUTextureUsage.RENDER_ATTACHMENT |
                    GPUTextureUsage.COPY_SRC,
                    alphaMode: 'opaque'
            };
            this.context.configure(canvasConfig);
        }

        const depthTextureDesc: GPUTextureDescriptor = {
            size: [this.canvas.width, this.canvas.height, 1],
            dimension: '2d',
            format: 'depth24plus-stencil8',
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
        };

        this.depthTexture = this.device.createTexture(depthTextureDesc);
        this.depthTextureView = this.depthTexture.createView();
    }

    // ✍️ Write commands to send to the GPU
    encodeCommands() {
        let colorAttachment: GPURenderPassColorAttachment = {
            view: this.colorTextureView,
            clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store'
        };

        const depthAttachment: GPURenderPassDepthStencilAttachment = {
            view: this.depthTextureView,
            depthClearValue: 1,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            stencilClearValue: 0,
            stencilLoadOp: 'clear',
            stencilStoreOp: 'store'
        };

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment
        };

        this.commandEncoder = this.device.createCommandEncoder();

        this.passEncoder = this.commandEncoder.beginRenderPass(renderPassDesc);
        this.passEncoder.setViewport(
            0,
            0,
            this.canvas.width,
            this.canvas.height,
            0,
            1
        );
        this.passEncoder.setScissorRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
                  
        this.renderObjects.forEach(object => {
            object.render(this.passEncoder);
        });

        this.passEncoder.end();
        this.queue.submit([this.commandEncoder.finish()]);
    }

    render = () => {
        // ⏭ Acquire next image from context
        // uniform = getTransformationMatrix(); 
        const now = Date.now();
        const deltaTime = (now - lastFrameMS) / 1000;
        lastFrameMS = now;

        const uniform = this.camera.update(deltaTime)
        // console.log(uniform)

        this.queue.writeBuffer(
            this.uniformBuffer,
            0,
            uniform.buffer,
            uniform.byteOffset,
            uniform.byteLength
        )

        this.colorTexture = this.context.getCurrentTexture();
        this.colorTextureView = this.colorTexture.createView();

        // 📦 Write and submit commands to queue
        this.encodeCommands();

        // ➿ Refresh canvas
        requestAnimationFrame(this.render);
    };
}


function getInitialMatrix() {
    const aspect = 1;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
    const viewMatrix = mat4.identity();
    mat4.translate(viewMatrix, vec3.fromValues(0, 0, -3), viewMatrix);
    return mat4.multiply(projectionMatrix, viewMatrix); 
}


function getTransformationMatrix() {
    const aspect = 1;
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
    const viewMatrix = mat4.identity();
    mat4.translate(viewMatrix, vec3.fromValues(0, 0, -3), viewMatrix);
    const now = Date.now() / 1000;
    mat4.rotate(
      viewMatrix,
      vec3.fromValues(Math.sin(now), Math.cos(now), 0),
      1,
      viewMatrix
    );

    let res = mat4.multiply(projectionMatrix, viewMatrix);
  
    return mat4.multiply(projectionMatrix, viewMatrix);
  }