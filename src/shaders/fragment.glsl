varying vec3 vUv;

void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = step(0.5, strength);
    strength = 1.0 - strength;
    vec3 color = vUv;
    gl_FragColor = vec4(color, strength);
}
