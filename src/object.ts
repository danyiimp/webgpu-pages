export interface RenderObject {
    initialize(device: GPUDevice): void;
    update(delta_time: number): void;

    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    uniformBuffer: GPUBuffer;
}


class TetraHedron implements RenderObject {
    positionBuffer: GPUBuffer;
    colorBuffer: GPUBuffer;
    indexBuffer: GPUBuffer;
    uniformBuffer: GPUBuffer;

    private positions = new Float32Array([
        Math.sqrt(8/9), 0.0, -1/3, 
        -Math.sqrt(2/9), Math.sqrt(2/3), -1/3, 
        -Math.sqrt(2/9), -Math.sqrt(2/3), -1/3, 
        0.0, 0.0, 1.0 
    ]);
    private colors = new Float32Array([
        1.0, 0.0, 0.0, 
        0.0, 1.0, 0.0, 
        0.0, 0.0, 1.0, 
        0.0, 0.0, 0.0
    ]);
    private indices = new Uint16Array([
        0, 1, 2, 
        0, 2, 3,
        0, 3, 1,
        1, 3, 2
    ]);
    
    createBuffer(device: GPUDevice, arr: Float32Array | Uint16Array, usage: number): GPUBuffer {
        let buffer = device.createBuffer({
            size: (arr.byteLength + 3) & ~3,
            usage,
            mappedAtCreation: true
        });
        const writeArray =
            arr instanceof Uint16Array
                ? new Uint16Array(buffer.getMappedRange())
                : new Float32Array(buffer.getMappedRange());
        writeArray.set(arr);
        buffer.unmap();
        return buffer;
    }

    initialize(device: GPUDevice): void {
        
    }

    update(delta_time: number): void {
        
    }
}
