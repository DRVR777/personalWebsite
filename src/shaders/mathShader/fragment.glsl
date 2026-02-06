uniform float time;
uniform vec2 resolution;
uniform vec3 color1;
uniform vec3 color2;

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);
    
    float pattern = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
    pattern += sin(vUv.x * 8.0 + time) * sin(vUv.y * 8.0 + time) * 0.25;
    
    vec3 color = mix(color1, color2, pattern);
    
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float brightness = dot(vNormal, light) * 0.5 + 0.5;
    color *= brightness;
    
    float glow = pow(1.0 - dist, 2.0) * 0.3;
    color += glow;
    
    gl_FragColor = vec4(color, 1.0);
}
