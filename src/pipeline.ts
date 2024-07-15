import { createBindGroupLayout, RenderObjectBase } from "./renderable";

export function createPipeline(
    device: GPUDevice,
    vertModule: GPUShaderModule,
    fragModule: GPUShaderModule,
    primitve: GPUPrimitiveTopology,
): GPURenderPipeline {
    const positionAttribDesc: GPUVertexAttribute = {
        shaderLocation: 0, // [[location(0)]]
        offset: 0,
        format: "float32x3",
    };
    const colorAttribDesc: GPUVertexAttribute = {
        shaderLocation: 1, // [[location(1)]]
        offset: 0,
        format: "float32x3",
    };
    const positionBufferDesc: GPUVertexBufferLayout = {
        attributes: [positionAttribDesc],
        arrayStride: 4 * 3, // sizeof(float) * 3
        stepMode: "vertex",
    };
    const colorBufferDesc: GPUVertexBufferLayout = {
        attributes: [colorAttribDesc],
        arrayStride: 4 * 3, // sizeof(float) * 3
        stepMode: "vertex",
    };
    const depthStencil: GPUDepthStencilState = {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
    };

    const frameBindGroupLayout = createBindGroupLayout(device, 0);
    const uniformBindGroupLayout = createBindGroupLayout(device, 0);
    const pipelineLayoutDesc = { bindGroupLayouts: [frameBindGroupLayout, uniformBindGroupLayout] };
    const layout = device.createPipelineLayout(pipelineLayoutDesc);

    // 🎭 Shader Stages
    const vertex: GPUVertexState = {
        module: vertModule,
        entryPoint: "main",
        buffers: [positionBufferDesc, colorBufferDesc],
    };

    // 🌀 Color/Blend State
    const colorState: GPUColorTargetState = {
        format: "bgra8unorm",
    };

    const fragment: GPUFragmentState = {
        module: fragModule,
        entryPoint: "main",
        targets: [colorState],
    };

    // 🟨 Rasterization
    const primitive: GPUPrimitiveState = {
        frontFace: "cw",
        cullMode: "none",
        topology: primitve,
    };

    const pipelineDesc: GPURenderPipelineDescriptor = {
        layout,
        vertex,
        fragment,
        primitive,
        depthStencil,
    };
    return device.createRenderPipeline(pipelineDesc);
}
