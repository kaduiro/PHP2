/**
 * Fluid Blueprint Header
 * Awwwards-level WebGL Header Effect
 * 
 * Features:
 * - Geometric Grid Waves (Perlin Noise)
 * - Floating Particles (Firefly Effect)
 * - Mouse Interaction (Lerp-based smooth follow)
 */

(function() {
    'use strict';

    // ===== SHADER CODE =====
    
    const gridVertexShader = `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uMouseInfluence;
        
        varying vec3 vPosition;
        varying float vElevation;
        
        // Perlin-like noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m;
            m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }
        
        void main() {
            vPosition = position;
            
            // Wave motion using Perlin noise
            float wave = snoise(position.xy * 0.5 + uTime * 0.3) * 0.5;
            wave += snoise(position.xy * 1.0 - uTime * 0.2) * 0.25;
            
            // Mouse interaction
            vec2 mousePos = uMouse * 20.0 - 10.0; // Map to grid space
            float dist = distance(position.xy, mousePos);
            float mouseEffect = smoothstep(3.0, 0.0, dist) * uMouseInfluence;
            
            // Combined elevation
            float elevation = wave + mouseEffect * 2.0;
            vElevation = elevation;
            
            vec3 newPosition = position;
            newPosition.z += elevation;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `;

    const gridFragmentShader = `
        uniform vec3 uColor;
        varying vec3 vPosition;
        varying float vElevation;
        
        void main() {
            // Grid lines
            vec2 grid = abs(fract(vPosition.xy) - 0.5);
            float line = step(0.48, max(grid.x, grid.y));
            
            // Color based on elevation
            vec3 color = mix(uColor * 0.3, uColor, vElevation * 0.5 + 0.5);
            
            // Glow effect
            float glow = smoothstep(0.0, 1.0, vElevation) * 0.5;
            color += vec3(glow);
            
            gl_FragColor = vec4(color, line * 0.8);
        }
    `;

    const particleVertexShader = `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uMouseInfluence;
        
        attribute float aScale;
        attribute float aPhase;
        
        varying float vAlpha;
        
        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = mod(((i.y + vec3(0.0, i1.y, 1.0)) * 34.0 + 1.0) * (i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0), 289.0);
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m;
            m = m*m;
            vec3 x = 2.0 * fract(p * 0.024390243902439) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 a0 = x - floor(x + 0.5);
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }
        
        void main() {
            vec3 pos = position;
            
            // Floating motion
            float noise = snoise(pos.xy * 0.5 + uTime * 0.2 + aPhase);
            pos.z += noise * 0.5;
            
            // Mouse interaction - attract or repel
            vec2 mousePos = uMouse * 20.0 - 10.0;
            vec2 toMouse = mousePos - pos.xy;
            float dist = length(toMouse);
            float force = smoothstep(5.0, 0.0, dist) * uMouseInfluence;
            
            // Repel particles
            pos.xy -= normalize(toMouse) * force * 0.5;
            
            // Pulsing alpha (firefly effect)
            vAlpha = (sin(uTime * 2.0 + aPhase * 10.0) * 0.5 + 0.5) * 0.8;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aScale * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const particleFragmentShader = `
        varying float vAlpha;
        
        void main() {
            // Circular particle
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
            
            // Glow color
            vec3 color = vec3(0.47, 0.56, 0.66);
            
            gl_FragColor = vec4(color, alpha);
        }
    `;

    // ===== MAIN CLASS =====
    
    class FluidBlueprint {
        constructor() {
            this.container = document.getElementById('ogawa-webgl-canvas');
            if (!this.container) return;

            this.width = this.container.offsetWidth;
            this.height = this.container.offsetHeight;
            this.mouse = new THREE.Vector2(0.5, 0.5);
            this.targetMouse = new THREE.Vector2(0.5, 0.5);
            this.mouseInfluence = 0;
            this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            this.init();
        }

        init() {
            // Scene
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.Fog(0xf7f8f5, 9, 32);

            // Camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                this.width / this.height,
                0.1,
                100
            );
            this.camera.position.set(0, 0, 10);

            // Renderer
            this.renderer = new THREE.WebGLRenderer({ 
                alpha: true, 
                antialias: true 
            });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.container.appendChild(this.renderer.domElement);

            // Create Grid
            this.createGrid();
            
            // Create Particles
            this.createParticles();

            // Events
            window.addEventListener('resize', this.onResize.bind(this));

            if (!this.prefersReducedMotion) {
                window.addEventListener('mousemove', this.onMouseMove.bind(this));
                window.addEventListener('touchmove', this.onTouchMove.bind(this));
                this.clock = new THREE.Clock();
                this.animate();
                return;
            }

            this.renderStatic();
        }

        createGrid() {
            const geometry = new THREE.PlaneGeometry(20, 20, 40, 40);
            
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                    uMouseInfluence: { value: 0 },
                    uColor: { value: new THREE.Color('#7e90a6') }
                },
                vertexShader: gridVertexShader,
                fragmentShader: gridFragmentShader,
                transparent: true,
                wireframe: false,
                side: THREE.DoubleSide
            });

            this.gridMesh = new THREE.Mesh(geometry, material);
            this.gridMesh.rotation.x = -Math.PI * 0.3;
            this.scene.add(this.gridMesh);
        }

        createParticles() {
            const count = 720;
            const positions = new Float32Array(count * 3);
            const scales = new Float32Array(count);
            const phases = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                
                // Position on grid intersections + random offset
                positions[i3] = (Math.random() - 0.5) * 20;
                positions[i3 + 1] = (Math.random() - 0.5) * 20;
                positions[i3 + 2] = Math.random() * 3;
                
                scales[i] = Math.random() * 2 + 1;
                phases[i] = Math.random() * Math.PI * 2;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
            geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                    uMouseInfluence: { value: 0 }
                },
                vertexShader: particleVertexShader,
                fragmentShader: particleFragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            this.particles = new THREE.Points(geometry, material);
            this.scene.add(this.particles);
        }

        onResize() {
            this.width = this.container.offsetWidth;
            this.height = this.container.offsetHeight;

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);

            if (this.prefersReducedMotion) {
                this.renderStatic();
            }
        }

        onMouseMove(e) {
            this.targetMouse.x = e.clientX / this.width;
            this.targetMouse.y = 1.0 - (e.clientY / this.height);
            this.mouseInfluence = 0.42;
        }

        onTouchMove(e) {
            if (e.touches.length > 0) {
                this.targetMouse.x = e.touches[0].clientX / this.width;
                this.targetMouse.y = 1.0 - (e.touches[0].clientY / this.height);
                this.mouseInfluence = 0.42;
            }
        }

        renderStatic() {
            if (this.gridMesh) {
                this.gridMesh.material.uniforms.uTime.value = 0;
                this.gridMesh.material.uniforms.uMouse.value.set(0.5, 0.5);
                this.gridMesh.material.uniforms.uMouseInfluence.value = 0;
            }

            if (this.particles) {
                this.particles.material.uniforms.uTime.value = 0;
                this.particles.material.uniforms.uMouse.value.set(0.5, 0.5);
                this.particles.material.uniforms.uMouseInfluence.value = 0;
            }

            this.renderer.render(this.scene, this.camera);
        }

        animate() {
            requestAnimationFrame(this.animate.bind(this));

            const elapsedTime = this.clock.getElapsedTime();

            // Smooth mouse follow (Lerp)
            this.mouse.lerp(this.targetMouse, 0.05);
            this.mouseInfluence *= 0.95; // Decay

            // Update uniforms
            if (this.gridMesh) {
                this.gridMesh.material.uniforms.uTime.value = elapsedTime;
                this.gridMesh.material.uniforms.uMouse.value.copy(this.mouse);
                this.gridMesh.material.uniforms.uMouseInfluence.value = this.mouseInfluence;
            }

            if (this.particles) {
                this.particles.material.uniforms.uTime.value = elapsedTime;
                this.particles.material.uniforms.uMouse.value.copy(this.mouse);
                this.particles.material.uniforms.uMouseInfluence.value = this.mouseInfluence;
            }

            this.renderer.render(this.scene, this.camera);
        }
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new FluidBlueprint());
    } else {
        new FluidBlueprint();
    }

})();
