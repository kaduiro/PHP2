/**
 * Awwwards-Level WebGL Image Effects
 * Concepts: 
 * 1. "Constructing Reality" (Appearance: Blueprint -> Real)
 * 2. "Precision & Revelation" (Hover: Real -> Blueprint Lens)
 */

// ===== SHADER CODE =====

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // === EFFECT: Fluid Concrete（スクロール歪み）===
    // スクロール速度に応じた縦方向の液状化歪み
    // アスペクト比を考慮して波の周波数を調整
    float aspect = uResolution.x / uResolution.y;
    float wave = sin(uv.x * 3.14159 * 3.0 + uTime * 2.0) * uSpeed * 0.05;
    pos.y += wave;
    
    // === EFFECT: Interactive Lift（マウス周辺の隆起 - 控えめに）===
    // レンズ効果と干渉しすぎないよう、物理的な隆起は微細にする
    float aspectCorrectedDist = distance(vec2(uv.x * aspect, uv.y), vec2(uMouse.x * aspect, uMouse.y));
    float lift = smoothstep(0.3, 0.0, aspectCorrectedDist) * 0.05;
    pos.z += lift;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uProgress; // 0: Blueprint -> 1: Real
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  
  // === UTIL: Noise Function ===
  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 2.0;
    for(int i = 0; i < 4; i++) {
      value += amplitude * noise(st * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // === FILTER: Sobel Edge Detection (輪郭抽出) ===
  vec3 sobel(sampler2D tex, vec2 uv, vec2 resolution) {
    float x = 1.0 / resolution.x;
    float y = 1.0 / resolution.y;
    
    // 周辺ピクセルのサンプリング
    vec4 horizEdge = vec4(0.0);
    horizEdge -= texture2D(tex, vec2(uv.x - x, uv.y - y)) * 1.0;
    horizEdge -= texture2D(tex, vec2(uv.x - x, uv.y    )) * 2.0;
    horizEdge -= texture2D(tex, vec2(uv.x - x, uv.y + y)) * 1.0;
    horizEdge += texture2D(tex, vec2(uv.x + x, uv.y - y)) * 1.0;
    horizEdge += texture2D(tex, vec2(uv.x + x, uv.y    )) * 2.0;
    horizEdge += texture2D(tex, vec2(uv.x + x, uv.y + y)) * 1.0;
    
    vec4 vertEdge = vec4(0.0);
    vertEdge -= texture2D(tex, vec2(uv.x - x, uv.y - y)) * 1.0;
    vertEdge -= texture2D(tex, vec2(uv.x    , uv.y - y)) * 2.0;
    vertEdge -= texture2D(tex, vec2(uv.x + x, uv.y - y)) * 1.0;
    vertEdge += texture2D(tex, vec2(uv.x - x, uv.y + y)) * 1.0;
    vertEdge += texture2D(tex, vec2(uv.x    , uv.y + y)) * 2.0;
    vertEdge += texture2D(tex, vec2(uv.x + x, uv.y + y)) * 1.0;
    
    vec3 edge = sqrt((horizEdge.rgb * horizEdge.rgb) + (vertEdge.rgb * vertEdge.rgb));
    return edge;
  }
  
  void main() {
    // スクリーンアスペクト比補正（正円を描くため）
    float aspect = uResolution.x / uResolution.y;
    vec2 aspectUv = vec2(vUv.x * aspect, vUv.y);
    vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);

    // 1. Base Texture (Real)
    vec4 texColor = texture2D(uTexture, vUv);
    
    // 2. Blueprint / Wireframe Generation
    vec3 blueprintBg = vec3(0.04, 0.1, 0.16); // Deep Navy (#0a1929)
    vec3 blueprintLine = vec3(0.0, 0.85, 1.0); // Cyan (#00d9ff)
    
    // Sobel Filterによる輪郭抽出
    vec3 edges = sobel(uTexture, vUv, uResolution);
    // 輪郭強度を調整し、青写真風の色味にする
    float edgeStrength = length(edges);
    vec3 schematic = mix(blueprintBg, blueprintLine, smoothstep(0.1, 0.6, edgeStrength));
    
    // グリッドオーバーレイ
    float grid = step(0.98, fract(vUv.x * 30.0)) + step(0.98, fract(vUv.y * 30.0));
    schematic = mix(schematic, blueprintLine, grid * 0.15); // グリッドを薄く合成

    // 3. Intro Animation: Constructing Reality (Schematic -> Real)
    float scanLine = fbm(vec2(vUv.y * 10.0 - uProgress * 15.0, uTime * 0.5));
    float scanMask = smoothstep(0.0, 0.3, uProgress) * smoothstep(1.0, 0.7, uProgress);
    float smoothProgress = smoothstep(0.0, 1.0, uProgress);
    
    // Introの合成結果
    vec3 viewColor = mix(schematic, texColor.rgb, smoothProgress);
    // スキャンラインのグロー
    viewColor += blueprintLine * scanLine * (1.0 - smoothProgress) * 0.5;

    // 4. Interaction: Architectural Lens (Real -> Schematic inside Lens)
    // 実体化後(uProgress >= 1.0)のみレンズを有効にする
    if (uProgress > 0.95) {
        float dist = distance(aspectUv, aspectMouse);
        float lensRadius = 0.25;
        float lensEdge = 0.05;
        
        // レンズマスク（中心が1、外側が0）
        float lensMask = smoothstep(lensRadius, lensRadius - lensEdge, dist);
        
        // レンズ境界の色収差（RGB Shift）
        float aberration = smoothstep(lensRadius - lensEdge - 0.02, lensRadius, dist) * lensMask;
        if (aberration > 0.01) {
             float shift = 0.01 * aberration;
             float r = texture2D(uTexture, vUv + vec2(shift, 0.0)).r;
             float b = texture2D(uTexture, vUv - vec2(shift, 0.0)).b;
             viewColor.r = mix(viewColor.r, r, aberration);
             viewColor.b = mix(viewColor.b, b, aberration);
        }

        // レンズ内を「輪郭抽出された図面」にする
        // マウスに近いほど、より純粋な設計図になる
        viewColor = mix(viewColor, schematic, lensMask);
    }

    gl_FragColor = vec4(viewColor, 1.0);
  }
`;

// ===== CUSTOM CURSOR (DOM) =====

const BLUEPRINT_TARGET_SELECTOR = '#garage-section .js-blueprint-target, #apartment-section .js-blueprint-target';
const BLUEPRINT_PC_QUERY = '(min-width: 769px)';
const BLUEPRINT_ACTIVE_CLASS = 'is-webgl-blueprint-active';
const BLUEPRINT_RENDERED_CLASS = 'is-blueprint-rendered';

class ArchitecturalCursor {
  constructor() {
    this.cursor = document.createElement('div');
    this.cursor.className = 'al-cursor';
    this.cursor.innerHTML = `
      <div class="al-cursor__crosshair"></div>
      <div class="al-cursor__coords">X: 000 Y: 000</div>
    `;
    document.body.appendChild(this.cursor);
    
    this.coordsEl = this.cursor.querySelector('.al-cursor__coords');
    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.frameId = null;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.animate = this.animate.bind(this);

    this.initEvents();
    this.animate();
  }
  
  initEvents() {
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);
    document.addEventListener('mouseenter', this.handleMouseEnter);
  }

  handleMouseMove(e) {
    if (!this.cursor) {
      return;
    }
    if (this.cursor.style.opacity !== '1') {
      this.cursor.style.opacity = '1';
    }

    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;

    if (Math.random() > 0.5) {
      this.coordsEl.innerText = `X: ${e.clientX.toString().padStart(4, '0')} Y: ${e.clientY.toString().padStart(4, '0')}`;
    }

    const target = e.target;
    if (target.closest('a') || target.closest('button') || target.closest('.t_biz__image-area')) {
      this.cursor.classList.add('is-active');
    } else {
      this.cursor.classList.remove('is-active');
    }
  }

  handleMouseLeave() {
    if (this.cursor) {
      this.cursor.style.opacity = '0';
    }
  }

  handleMouseEnter() {
    if (this.cursor) {
      this.cursor.style.opacity = '1';
    }
  }
  
  animate() {
    if (!this.cursor) {
      return;
    }
    // Smooth follow
    const dt = 1.0 - Math.pow(0.8, gsap.ticker.deltaRatio());
    this.pos.x += (this.mouse.x - this.pos.x) * dt;
    this.pos.y += (this.mouse.y - this.pos.y) * dt;
    
    gsap.set(this.cursor, {
      x: this.pos.x,
      y: this.pos.y
    });
    
    this.frameId = requestAnimationFrame(this.animate);
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    if (this.cursor && this.cursor.parentNode) {
      this.cursor.parentNode.removeChild(this.cursor);
    }
    this.cursor = null;
  }
}

// ===== THREE.JS SETUP =====

class WebGLImageEffects {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.planes = [];
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.lenis = null;
    this.scrollSpeed = 0;
    this.time = 0;
    this.cursor = null;
    this.animationFrameId = null;
    this.isDestroyed = false;
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);

    this.init();
  }
  
  init() {
    // レンダラー初期化
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // カメラ初期化（Orthographic for 2D）
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1;
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000
    );
    this.camera.position.z = 1;
    
    // Lenis初期化（スムーズスクロール）
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true
    });
    
    // 画像エレメントを取得してWebGL化
    this.createPlanes();
    
    // イベントリスナー
    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('mousemove', this.boundOnMouseMove);

    // カスタムカーソル初期化
    this.cursor = new ArchitecturalCursor();
    
    // アニメーションループ開始
    this.animate();
  }
  
  createPlanes() {
    const images = document.querySelectorAll(BLUEPRINT_TARGET_SELECTOR);
    
    images.forEach((img, index) => {
      if (this.isDestroyed) return;
      const imageArea = img.closest('.t_biz__image-area');
      if (!imageArea) return;

      imageArea.querySelectorAll('.webgl-canvas').forEach((existingCanvas) => {
        existingCanvas.remove();
      });
      
      // WebGLキャンバスを作成
      const canvas = document.createElement('canvas');
      canvas.classList.add('webgl-canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '1';
      imageArea.appendChild(canvas);
      
      // 画像ロード待ち
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(img.src, (texture) => {
        if (this.isDestroyed) {
          texture.dispose();
          canvas.remove();
          return;
        }
        // テクスチャ設定
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Geometry & Material
        const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTexture: { value: texture },
            uProgress: { value: 0.0 },
            uSpeed: { value: 0.0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uTime: { value: 0.0 },
            uResolution: { value: new THREE.Vector2(imageArea.offsetWidth, imageArea.offsetHeight) }
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          transparent: false,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // シーンに追加
        const planeScene = new THREE.Scene();
        planeScene.add(mesh);
        
        // カメラのクローン
        const planeCamera = this.camera.clone();
        
        // レンダラーのクローン
        const planeRenderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: true,
          antialias: true
        });
        planeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const planeObj = {
          mesh,
          material,
          scene: planeScene,
          camera: planeCamera,
          renderer: planeRenderer,
          canvas,
          imageArea,
          originalImg: img
        };
        
        this.planes.push(planeObj);
        img.classList.add(BLUEPRINT_RENDERED_CLASS);
        document.body.classList.add(BLUEPRINT_ACTIVE_CLASS);
        
        // GSAP出現アニメーション（Blueprint Scan）
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            
            gsap.to(material.uniforms.uProgress, {
              value: 1,
              duration: 2.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: imageArea,
                start: "top 80%",
                toggleActions: "play none none none"
              }
            });
          } else {
            // Fallback
            gsap.to(material.uniforms.uProgress, {
              value: 1,
              duration: 2.5,
              delay: index * 0.3,
              ease: "power2.out"
            });
          }
        
        // 初期リサイズ
        this.updatePlaneSize(planeObj);
      }, undefined, () => {
        canvas.remove();
        img.classList.remove(BLUEPRINT_RENDERED_CLASS);
      });
    });
  }
  
  updatePlaneSize(plane) {
    if (!plane || !plane.renderer || !plane.material || !plane.camera || !plane.mesh) {
      return;
    }
    const rect = plane.imageArea.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    
    // レンダラーサイズ更新
    plane.renderer.setSize(rect.width, rect.height);
    
    // シェーダーに解像度を渡す（Sobelフィルタ用）
    plane.material.uniforms.uResolution.value.set(rect.width, rect.height);
    
    // カメラのアスペクト比更新
    const aspect = rect.width / rect.height;
    const frustumSize = 1;
    plane.camera.left = -frustumSize * aspect / 2;
    plane.camera.right = frustumSize * aspect / 2;
    plane.camera.top = frustumSize / 2;
    plane.camera.bottom = -frustumSize / 2;
    plane.camera.updateProjectionMatrix();
    
    // メッシュのアスペクト比調整
    plane.mesh.scale.x = aspect;
  }
  
  onResize() {
    this.planes.forEach(plane => {
      this.updatePlaneSize(plane);
    });
  }
  
  onMouseMove(event) {
    if (this.isDestroyed) {
      return;
    }
    // 正規化マウス座標（0-1）
    // 注意: DOM要素内の相対座標ではなく、画面全体の正規化座標を渡す（シェーダー側で計算オフセット）
    // 今回はPlaneが画面全体ではなく個別にあるため、Planeごとのローカル座標を計算する方が正確だが
    // 簡略化のためグローバル座標を渡し、必要に応じて補正する
    
    const x = event.clientX;
    const y = event.clientY;
    
    this.planes.forEach(plane => {
        const rect = plane.imageArea.getBoundingClientRect();
        // 画像エリア内での相対座標 (0-1)
        // エリア外の場合は 0-1 の範囲外になるが、dist計算で遠ざかるので問題ない
        const localX = (x - rect.left) / rect.width;
        const localY = 1.0 - (y - rect.top) / rect.height; // WebGLはY軸が逆
        
        // アスペクト比補正はシェーダー側で行うため、ここでは0-1を渡す
        plane.material.uniforms.uMouse.value.set(localX, localY);
    });
  }
  
  animate(time = 0) {
    if (this.isDestroyed) {
      return;
    }
    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
    
    // Lenis更新
    if (this.lenis && typeof this.lenis.raf === 'function') {
      this.lenis.raf(time);
      this.scrollSpeed = this.lenis.velocity * 0.01;
    }
    
    // 時間更新
    this.time += 0.01;
    
    // 各Planeをレンダリング
    this.planes.forEach(plane => {
      plane.material.uniforms.uSpeed.value = this.scrollSpeed;
      plane.material.uniforms.uTime.value = this.time;
      
      plane.renderer.render(plane.scene, plane.camera);
    });
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('mousemove', this.boundOnMouseMove);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.cursor) {
      this.cursor.destroy();
      this.cursor = null;
    }

    if (this.lenis && typeof this.lenis.destroy === 'function') {
      this.lenis.destroy();
    }
    this.lenis = null;

    this.planes.forEach((plane) => {
      if (plane.originalImg) {
        plane.originalImg.classList.remove(BLUEPRINT_RENDERED_CLASS);
      }

      if (plane.material && plane.material.uniforms && plane.material.uniforms.uTexture && plane.material.uniforms.uTexture.value) {
        plane.material.uniforms.uTexture.value.dispose();
      }
      if (plane.mesh && plane.mesh.geometry) {
        plane.mesh.geometry.dispose();
      }
      if (plane.material) {
        plane.material.dispose();
      }
      if (plane.renderer) {
        if (typeof plane.renderer.forceContextLoss === 'function') {
          plane.renderer.forceContextLoss();
        }
        plane.renderer.dispose();
      }
      if (plane.canvas && plane.canvas.parentNode) {
        plane.canvas.parentNode.removeChild(plane.canvas);
      }
    });
    this.planes = [];

    if (this.renderer) {
      if (typeof this.renderer.forceContextLoss === 'function') {
        this.renderer.forceContextLoss();
      }
      this.renderer.dispose();
      this.renderer = null;
    }

    document.body.classList.remove(BLUEPRINT_ACTIVE_CLASS);
  }
}

// ===== INITIALIZATION =====

let webglBlueprintInstance = null;

function enableBlueprintEffects() {
  if (webglBlueprintInstance) {
    return;
  }
  if (!document.querySelector(BLUEPRINT_TARGET_SELECTOR)) {
    return;
  }
  webglBlueprintInstance = new WebGLImageEffects();
}

function disableBlueprintEffects() {
  if (webglBlueprintInstance) {
    webglBlueprintInstance.destroy();
    webglBlueprintInstance = null;
  }
  document.body.classList.remove(BLUEPRINT_ACTIVE_CLASS);
  document.querySelectorAll('.webgl-canvas').forEach((canvas) => canvas.remove());
  document.querySelectorAll(BLUEPRINT_TARGET_SELECTOR).forEach((img) => {
    img.classList.remove(BLUEPRINT_RENDERED_CLASS);
  });
}

function initResponsiveBlueprintEffects() {
  const media = window.matchMedia(BLUEPRINT_PC_QUERY);
  const handleMediaChange = () => {
    if (media.matches) {
      enableBlueprintEffects();
    } else {
      disableBlueprintEffects();
    }
  };

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handleMediaChange);
  } else if (typeof media.addListener === 'function') {
    media.addListener(handleMediaChange);
  }

  handleMediaChange();

  window.addEventListener('beforeunload', () => {
    disableBlueprintEffects();
    if (typeof media.removeEventListener === 'function') {
      media.removeEventListener('change', handleMediaChange);
    } else if (typeof media.removeListener === 'function') {
      media.removeListener(handleMediaChange);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof THREE !== 'undefined' && typeof gsap !== 'undefined' && typeof Lenis !== 'undefined') {
    initResponsiveBlueprintEffects();
  } else {
    console.error('Required libraries not loaded: THREE.js, GSAP, or Lenis');
  }
});
