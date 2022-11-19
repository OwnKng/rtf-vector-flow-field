uniform float uTime;
uniform float uOffset; 
uniform float uSpeed; 

varying vec2 vUv; 

#include hsl2rgb.glsl;

void main() {
    float time = fract(uOffset + uTime); 
    float thickness = 0.075; 
    float xEnd = step(vUv.x, time); 
    float xStart = 1.0 - step(vUv.x, time + thickness); 
    float alpha = 1.0 - (xEnd + xStart); 
    alpha *= 1.0 - abs(vUv.x - 0.5); 
    alpha = pow(alpha, 5.0); 

    vec3 color = hsl2rgb(0.1, alpha * 0.8, alpha * 0.8); 

    gl_FragColor = vec4(color, alpha); 

    //gl_FragColor = vec4(vec3(0.518,0.902,0.973), alpha); 
} 