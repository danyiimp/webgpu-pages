import { Mat4, mat4 } from "wgpu-matrix";
import { Mesh } from "./mesh";
import { createPipeline } from "./pipeline";

export interface RenderObject {
    initialize(device: GPUDevice): void;
    render(passEncoder: GPURenderPassEncoder): void;

    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    bindGroup?: GPUBindGroup;
    bindGroupLayout?: GPUBindGroupLayout;
    frameBindGroup?: GPUBindGroup;
    fameBindGroupLayout?: GPUBindGroupLayout;
}

export class RenderObjectBase implements RenderObject {
    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    bindGroup?: GPUBindGroup;
    bindGroupLayout?: GPUBindGroupLayout;

    static frameBindGroup?: GPUBindGroup;
    static fameBindGroupLayout?: GPUBindGroupLayout;

    static lineListPipeline: GPURenderPipeline | null = null;
    static triangleListPipeline: GPURenderPipeline | null = null;

    private mesh: Mesh;
    private transform: Mat4;

    constructor(mesh: Mesh, transform: Mat4 = mat4.identity()) {
        this.mesh = mesh;
        this.transform = transform;
    }

    initialize(device: GPUDevice): void {
        this.positionBuffer = createBuffer(device, this.mesh.vertices, GPUBufferUsage.VERTEX);
        this.colorBuffer = createBuffer(device, this.mesh.colors, GPUBufferUsage.VERTEX);
        this.indexBuffer = createBuffer(device, this.mesh.indices, GPUBufferUsage.INDEX);

        this.bindGroupLayout = createBindGroupLayout(device, 0);
        this.bindGroup = createBindGroup(device, this.transform, this.bindGroupLayout);
    }

    render(passEncoder: GPURenderPassEncoder): void {
        let pipeline: GPURenderPipeline | null;
        switch (this.mesh.primitive) {
            case "line-list":
                pipeline = RenderObjectBase.lineListPipeline;
                break;
            default:
                pipeline = RenderObjectBase.triangleListPipeline;
                break;
        }
        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, this.positionBuffer);
        passEncoder.setVertexBuffer(1, this.colorBuffer);
        passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
        passEncoder.setBindGroup(0, RenderObjectBase.frameBindGroup);
        passEncoder.setBindGroup(1, this.bindGroup);
        passEncoder.drawIndexed(this.mesh.indices.length, 1);
    }

    static initializeStatic(
        device: GPUDevice,
        vertModule: GPUShaderModule,
        fragModule: GPUShaderModule,
        uniformBuffer: GPUBuffer
    ): void {
        this.lineListPipeline = createPipeline(device, vertModule, fragModule, "line-list");
        this.triangleListPipeline = createPipeline(device, vertModule, fragModule, "triangle-list");

        this.fameBindGroupLayout = createBindGroupLayout(device, 0);
        this.frameBindGroup = createBindGroup(device, mat4.identity(), this.fameBindGroupLayout, uniformBuffer);
    }
}

export function createBindGroupLayout(device: GPUDevice, binding: number): GPUBindGroupLayout {
    const uniformBindGroupLayout: GPUBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: binding,
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
            },
        ],
    });
    return uniformBindGroupLayout;
}

export function createBindGroup(
    device: GPUDevice,
    transform: Mat4,
    uniformBindGroupLayout: GPUBindGroupLayout,
    uniformBuffer?: GPUBuffer
): GPUBindGroup {
    if (!uniformBuffer) {
        uniformBuffer = createBuffer(device, transform, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    }
    const uniformBindGroup = device.createBindGroup({
        layout: uniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            },
        ],
    });
    return uniformBindGroup;
}

export function createBuffer(device: GPUDevice, arr: Float32Array | Uint16Array, usage: number): GPUBuffer {
    let buffer = device.createBuffer({
        size: (arr.byteLength + 3) & ~3,
        usage,
        mappedAtCreation: true,
    });
    const writeArray =
        arr instanceof Uint16Array
            ? new Uint16Array(buffer.getMappedRange())
            : new Float32Array(buffer.getMappedRange());
    writeArray.set(arr);
    buffer.unmap();
    return buffer;
}

export function getRandomTransformMatrix() {
    const matrix = mat4.identity();
    const scale = 0.1;
    mat4.translate(matrix, [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1], matrix);
    mat4.rotate(matrix, [Math.random(), Math.random(), Math.random()], Math.random() * Math.PI, matrix);
    mat4.scale(matrix, [scale, scale, scale], matrix);
    return matrix;
}
