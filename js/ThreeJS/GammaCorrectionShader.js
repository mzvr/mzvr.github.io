/**
 * Gamma Correction Shader
 * http://en.wikipedia.org/wiki/gamma_correction
 */

 var GammaCorrectionShader = {

	uniforms: {

		'tDiffuse': { value: null },
        'gamma': { value: 2.2 }

	},

	vertexShader: [

		'varying vec2 vUv;',

		'void main() {',

		'	vUv = uv;',
		'	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

		'}'

	].join( '\n' ),

	fragmentShader: [

		'uniform sampler2D tDiffuse;',

		'varying vec2 vUv;',

        'uniform float gamma;',

		'void main() {',

		'	vec4 tex = texture2D( tDiffuse, vUv );',

		'	gl_FragColor = LinearToGamma( tex, float( gamma ) );', // optional: LinearToGamma( tex, float( GAMMA_FACTOR ) );

		'}'

	].join( '\n' )

};

export { GammaCorrectionShader };