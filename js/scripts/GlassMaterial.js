import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
//import { ShaderMaterial } from './ShaderMaterial.js';

class GlassMaterial extends THREE.ShaderMaterial{
    constructor( reflectionMap, normalMap = null )
    // custom shader material
    {
        var USE_NORMAL = (normalMap != null);

        super(
            {
            uniforms: {
                envMap: { value: (reflectionMap!=null) ? reflectionMap : new THREE.Texture() },
                normalMap: { value: (USE_NORMAL) ? normalMap : new THREE.Texture() }
            },
            vertexShader: `
                attribute vec3 tangent;
                
                varying vec3 rayDir;
                varying vec3 worldNorm;`
                +
                (USE_NORMAL ? `
                varying mat3 TBN;
                varying vec2 _uv;` : ``)
                + `
                void main() {
                vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                worldNorm = (mat3(modelMatrix) * normal);` 
                +
                (USE_NORMAL ? 
                `vec3 worldTangent = (mat3(modelMatrix) * tangent);
                worldTangent = normalize(worldTangent- dot(worldTangent, worldNorm) * worldNorm);
                vec3 worldBinorm = cross(worldNorm, worldTangent);
                _uv = uv;
                TBN = mat3(worldTangent, worldBinorm, worldNorm);` : ``)
                + `
                rayDir = worldPos-cameraPosition;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
            fragmentShader: `
                varying vec3 rayDir;
                varying vec3 worldNorm;`
                +
                (USE_NORMAL ? `
                varying mat3 TBN;
                varying vec2 _uv;
                uniform sampler2D normalMap;` : ``)
                + `
                uniform sampler2D envMap;
                
                const vec2 invAtan = vec2(0.1591, 0.3183);
                vec2 SampleEquirectMap(vec3 direction) {
                    vec2 uv = vec2(atan(direction.z, direction.x), asin(direction.y));
                    uv *= invAtan;
                    uv += 0.5;
                    return uv;
                }
                
                vec3 decodeRGBE( vec4 hdr ) {
                    return hdr.rgb * exp2( (hdr.a*255.0)-128.0 );
                    // return hdr.rgb * pow( 2.0, (hdr.a*255.0)-128.0 );
                }`
                + `
                const float MIN_ALPHA = 0.1;
                void main() {
                    vec3 ray = normalize(rayDir);`
                    +
                    (USE_NORMAL ? `
                    vec3 norm = TBN * (texture(normalMap, _uv).xyz * 2.0 - 1.0);
                    vec3 refl = reflect(ray, norm);

                    //vec4 rgbe = texture(envMap, SampleEquirectMap(refl));
                    //vec3 rgb = decodeRGBE(rgbe);
                    vec3 rgb = texture(envMap, SampleEquirectMap(refl)).xyz;

                    float fresnel = 1.0 + dot(ray, norm);` 
                    : `
                    vec3 refl = reflect(ray, worldNorm);

                    //vec4 rgbe = texture(envMap, SampleEquirectMap(refl));
                    //vec3 rgb = decodeRGBE(rgbe);
                    vec3 rgb = texture(envMap, SampleEquirectMap(refl)).xyz;

                    float fresnel = 1.0 + dot(ray, worldNorm);`)
                    + `
                    fresnel = max(fresnel * fresnel, MIN_ALPHA);
                
                    gl_FragColor = vec4(rgb , fresnel );
                }`,
                
            depthWrite: false
        });
    }
}

export { GlassMaterial };