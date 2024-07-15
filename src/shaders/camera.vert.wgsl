struct UBO {
    viewProjectionMatrix : mat4x4f,
}

@group(0) @binding(0) var<uniform> uniforms : UBO;

@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;


struct VSOut {
    @builtin(position) pos: vec4f,
    @location(0) color: vec3f,
 };

@vertex
fn main(
    @location(0) inPos : vec3f,
    @location(1) inColor : vec3f
) -> VSOut {
    var vs_out : VSOut;
    vs_out.pos = uniforms.viewProjectionMatrix * modelMatrix * vec4f(inPos, 1);
    vs_out.color = inColor;
    return vs_out;
}