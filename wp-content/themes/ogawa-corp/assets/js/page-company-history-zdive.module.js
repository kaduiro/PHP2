
const themeBaseUrl = (window.ogawaCorpTheme && window.ogawaCorpTheme.themeUrl) ? window.ogawaCorpTheme.themeUrl : '';

/* ================================================================
   DATA 驕ｯ・ｶ郢晢ｽｻ髯ｷ螟ｲ・ｽ・ｯ髣包ｽｳ・つ驍ｵ・ｺ繝ｻ・ｮ鬨ｾ・ｵ雋・ｽｷ繝ｻ・ｮ郢晢ｽｻ
   ================================================================ */
const timelineItems = [
  {
    era: "1958",
    title: "創業",
    body: "地域に根ざした建設会社として創業。",
    image: themeBaseUrl + '/assets/images/company/ogawacloset.jpg'
  },
  {
    era: "1967",
    title: "株式会社へ組織変更",
    body: "事業基盤の拡大に合わせて組織体制を強化。",
    image: themeBaseUrl + '/assets/images/company/ogawarinenA.jpg'
  },
  {
    era: "1983",
    title: "設備投資を拡充",
    body: "現場品質と生産性向上のため設備を更新。",
    image: themeBaseUrl + '/assets/images/company/ogawarinenB.jpg'
  },
  {
    era: "1989",
    title: "本社機能を拡張",
    body: "受注増加に合わせ、管理・設計機能を強化。",
    image: themeBaseUrl + '/assets/images/company/ogawarinenC.jpg'
  },
  {
    era: "2012",
    title: "安全品質の再定義",
    body: "現場運用を見直し、品質基準と教育を再構築。",
    image: themeBaseUrl + '/assets/images/company/ogawagenba.jpg'
  },
  {
    era: "2015",
    title: "事業エリア拡大",
    body: "新規案件の増加に対応し、体制を再編。",
    image: themeBaseUrl + '/assets/images/company/ogawa-genba.jpg'
  },
  {
    era: "2017",
    title: "次世代体制へ移行",
    body: "若手育成と技術継承の取り組みを本格化。",
    image: themeBaseUrl + '/assets/images/company/ogawa-closet.jpg'
  },
  {
    era: "2018",
    title: "海外拠点の強化",
    body: "グローバル展開に向けて拠点運用を最適化。",
    image: themeBaseUrl + '/assets/images/company/ogawavietnam.jpg'
  }
];

const N = timelineItems.length;
const ZDIVE_BOOTSTRAP_TIMEOUT_MS = 12000;
let zdiveBootstrapped = false;

function renderReducedMotionFallback() {
  const c = document.getElementById('fallback-timeline-container');
  if (!c || c.children.length > 0) return;
  timelineItems.forEach(it => {
    c.innerHTML += `<div class="fallback-panel"><div class="era">${it.era}</div><h3>${it.title}</h3><div>${it.body}</div><img src="${it.image}" alt="${it.title}" loading="lazy" onerror="this.style.display='none'"></div>`;
  });
  buildHistoryOverview(timelineItems);
}

function failoverToFallback(message) {
  const errorEl = document.getElementById('zdive-error');
  const section = document.getElementById('mk-history-zdive');
  const progressEl = document.getElementById('zdive-progress');
  const fallbackEl = document.getElementById('fallback-timeline-container');

  if (errorEl) {
    errorEl.style.display = 'block';
    errorEl.textContent = message;
  }
  console.error(message);
  if (section) section.style.display = 'none';
  if (progressEl) progressEl.style.display = 'none';
  renderReducedMotionFallback();
  if (fallbackEl) fallbackEl.style.display = 'block';
}

function bootstrapZDive(startedAt = performance.now()) {
  if (zdiveBootstrapped) return;
  const gsapReady = typeof window.gsap !== 'undefined';
  const scrollTriggerReady = typeof window.ScrollTrigger !== 'undefined';
  const threeReady = typeof window.THREE !== 'undefined';

  if (gsapReady && scrollTriggerReady && threeReady) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    zdiveBootstrapped = true;
    buildHistoryOverview(timelineItems);
    initZDive();
    return;
  }

  if ((performance.now() - startedAt) >= ZDIVE_BOOTSTRAP_TIMEOUT_MS) {
    failoverToFallback(
      `[Z-Dive Error] Library initialization timed out. gsap=${gsapReady}, scrollTrigger=${scrollTriggerReady}, three=${threeReady}`
    );
    return;
  }

  requestAnimationFrame(() => bootstrapZDive(startedAt));
}

/* reduced-motion fallback */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  renderReducedMotionFallback();
  const fallbackEl = document.getElementById('fallback-timeline-container');
  if (fallbackEl) fallbackEl.style.display = 'block';
} else {
  if (document.readyState === 'complete') {
    bootstrapZDive();
  } else {
    window.addEventListener('load', () => bootstrapZDive(), { once: true });
  }
}

function initZDive() {
  const section    = document.getElementById('mk-history-zdive');
  const canvas     = document.getElementById('zdive-canvas');
  const panelLayer = document.getElementById('zdive-panels-layer');
  const errorEl    = document.getElementById('zdive-error');
  const progressEl = document.getElementById('zdive-progress');
  const progressFill = document.getElementById('zdive-progress-fill');
  const progressCounter = document.getElementById('zdive-progress-counter');
  const ScrollTriggerRef = window.ScrollTrigger;
  const THREE = window.THREE;
  if (!section || !canvas || !panelLayer) return;

  // Recover from previous runtime state that may have hidden Z-Dive.
  document.body.classList.remove('skip-zdive');
  section.style.display = '';
  section.style.height = '100vh';
  canvas.style.display = '';
  panelLayer.style.display = '';
  if (progressEl) progressEl.style.display = '';

  if (typeof ScrollTriggerRef === 'undefined') {
    failoverToFallback('[Z-Dive Error] ScrollTrigger unavailable.');
    return;
  }
  if (typeof THREE === 'undefined') {
    failoverToFallback('[Z-Dive Error] Three.js unavailable.');
    return;
  }

  /* ============================================================
     A髫ｴ・ｯ郢晢ｽｻ NO PIN 驕ｯ・ｶ郢晢ｽｻ驛｢・ｧ繝ｻ・ｻ驛｢・ｧ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｷ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ鬯ｯ・ｮ陋滂ｽ･繝ｻ繝ｻ・ｹ・ｧ髮区ｨ｣・ｦ蜻ｵ蟠慕ｹ晢ｽｻ遶頑･｢諢ｾ隰費ｽｶ繝ｻ鬘費ｽｸ・ｲ遶擾ｽｬ郢晢ｽｻ髴取ｻゑｽｽ・ｶ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ鬯ｨ・ｾ繝ｻ・｣髯ｷ髦ｪ繝ｻ
     Canvas/驛｢譏懶ｽｻ・｣郢晢ｽｭ驛｢譎｢・ｽ・ｫ髯橸ｽｻ繝ｻ・､驍ｵ・ｺ繝ｻ・ｯ position:sticky 驍ｵ・ｺ繝ｻ・ｧ鬨ｾ蛹・ｽｽ・ｻ鬯ｮ・ｱ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｫ髯滓汚・ｽ・ｵ驛｢・ｧ髮榊・・ｽ・ｻ陋滂ｽ･繝ｻ・･
     ============================================================ */
  const VH_PER_CARD = 180; // Scroll range per card (vh). Increased to avoid overshooting to the end on small wheel/trackpad input.
  section.style.height = '100vh';

  let W = window.innerWidth, H = window.innerHeight;

  /* ---- Three.js 鬮｢・ｭ隴ｴ・ｧ陷搾ｽｹ ---- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  // Pure white fog
  scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00012);
  const camera = new THREE.PerspectiveCamera(50, W/H, 1, 12000);
  camera.position.set(0, 0, 100);

  // 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・｡驛｢譎｢・ｽ・ｩ驍ｵ・ｺ隶呵ｶ｣・ｽ・ｧ繝ｻ・ｻ髯ｷ蟠趣ｽｼ謚ｫ繝ｻ驛｢・ｧ陷ｿ・･郢晢ｽｻZ鬮ｴ閧ｴ霎ｨ陞ｻ・ｬ: 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ 驕ｶ鄙ｫ繝ｻZ=0, 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ 驕ｶ鄙ｫ繝ｻZ=-4200
  const CARD_Z_SPACING = 600;
  const totalZRange = (N - 1) * CARD_Z_SPACING + 400;

  // 驛｢譏懶ｽｻ・｣郢晢ｽｻ驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｫ 驕ｯ・ｶ郢晢ｽｻ髯ｷ闌ｨ・ｽ・ｨZ鬩包ｽｽ郢晢ｽｻ陝ｲ繝ｻ・ｸ・ｺ繝ｻ・ｫ髯懶ｽｮ郢晢ｽｻ繝ｻ・ｭ陝ｲ・ｨ遶頑･｢・ｬ・ｨ繝ｻ・｣驛｢・ｧ陝ｲ・ｨ隨倥・
  const pGeo = new THREE.BufferGeometry();
  const pN = 1000;
  const pp = new Float32Array(pN*3);
  for(let i=0;i<pN;i++){pp[i*3]=(Math.random()-.5)*3000;pp[i*3+1]=(Math.random()-.5)*2000;pp[i*3+2]=300-(i/pN)*(totalZRange+600)}
  pGeo.setAttribute('position',new THREE.BufferAttribute(pp,3));
  // White theme particles: grayish blue
  const pMat = new THREE.PointsMaterial({color:0xA0B5CB,size:3,transparent:true,opacity:.6,blending:THREE.NormalBlending});
  const particlesMesh = new THREE.Points(pGeo,pMat);
  scene.add(particlesMesh);

  // 髯晢ｽｷ繝ｻ・ｾ髣厄ｽｴ陟・屮・ｽ・ｵ繝ｻ・ｮ鬯ｩ證ｮ・｡遘假ｽｻ繝ｻ驕ｯ・ｶ郢晢ｽｻ髯ｷ・ｷ郢晢ｽｻ邵ｺ蜥ｲ・ｹ譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ邵ｺ・ｰ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｫ7驍ｵ・ｲ郢晢ｽｻ髯区ｻ会ｽｹ譏ｶ繝ｻ驍ｵ・ｺ繝ｻ・､髣厄ｽｫ隴弱・・ｽ・ｨ繝ｻ・ｼ鬯ｩ貅ｷ隱ｿ繝ｻ・ｽ繝ｻ・ｮ
  const geos=[
    new THREE.TetrahedronGeometry(40), new THREE.OctahedronGeometry(35),  new THREE.IcosahedronGeometry(38),
    new THREE.TetrahedronGeometry(26), new THREE.OctahedronGeometry(24),  new THREE.IcosahedronGeometry(28),
    new THREE.DodecahedronGeometry(32),new THREE.TetrahedronGeometry(18), new THREE.OctahedronGeometry(22)
  ];
  const floaters=[];
  const PER_CARD = 8;
  for(let cardIdx=0; cardIdx<N; cardIdx++){
    const cardCenterZ = -cardIdx * CARD_Z_SPACING;
    for(let j=0; j<PER_CARD; j++){
      const mat = new THREE.MeshBasicMaterial({color:0x0A2463,wireframe:true,transparent:true,
        opacity: 0.08 + Math.random() * 0.12});
      const m = new THREE.Mesh(geos[(cardIdx*PER_CARD+j) % geos.length], mat);
      // Z: 驍ｵ・ｺ髦ｮ蜷ｶ繝ｻ驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・ｼ驛｢譎擾ｽｳ・ｨ郢晢ｽｻ髯ｷ隨ｬ・ｦ螂・ｽｽ・ｾ陋溷・・ｽ・ｱ300 驍ｵ・ｺ繝ｻ・ｫ髯具ｽｻ郢晢ｽｻ雎ｺ・ｵ
      const zPos = cardCenterZ + (Math.random() - 0.5) * CARD_Z_SPACING;
      m.position.set((Math.random()-.5)*1800, (Math.random()-.5)*1100, zPos);
      m.userData={
        rx:(Math.random()-.5)*.012,
        ry:(Math.random()-.5)*.012,
        rz:(Math.random()-.5)*.008,
        bx:m.position.x,
        by:m.position.y,
        bz:m.position.z,
        ax:150 + Math.random()*300,
        ay:120 + Math.random()*260,
        az:80  + Math.random()*180,
        fx:0.14 + Math.random()*0.42,
        fy:0.35 + Math.random()*0.85,
        fz:0.18 + Math.random()*0.55,
        px:Math.random()*Math.PI*2,
        py:Math.random()*Math.PI*2,
        pz:Math.random()*Math.PI*2,
        fx2:0.07 + Math.random()*0.19,
        fy2:0.11 + Math.random()*0.28,
        fz2:0.09 + Math.random()*0.22,
        px2:Math.random()*Math.PI*2,
        py2:Math.random()*Math.PI*2,
        pz2:Math.random()*Math.PI*2
      };
      scene.add(m); floaters.push(m);
    }
  }

  /* ---- DOM驛｢譏懶ｽｻ・｣郢晢ｽｭ驛｢譎｢・ｽ・ｫ鬨ｾ蠅難ｽｻ阮吶・ ---- */
  const panels = [];
  const isMob = W <= 768;

  timelineItems.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'zdive-panel';
    el.innerHTML = `
      <div class="era">${item.era}</div>
      <h3>${item.title}</h3>
      <div class="body">${item.body}</div>
      <img src="${item.image}" alt="${item.title}" loading="lazy"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22><rect fill=%22%23001A3D%22 width=%22600%22 height=%22400%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23D0B090%22 font-size=%2224%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>No Image</text></svg>'"/>
    `;
    panelLayer.appendChild(el);
    const xPx = isMob ? (i%2===0?15:-15) : (i%2===0?120:-120);
    panels.push({ el, xPx, index: i });
  });

  /* Assert */
  if (panels.length !== N) {
    if(errorEl){errorEl.style.display='block';errorEl.textContent=`[Z-Dive Error] Expected ${N} panels, got ${panels.length}`;}
  }
  console.log(`[Z-Dive v3] ${panels.length}/${N} panels OK 驕ｯ・ｶ郢晢ｽｻno-pin mode`);

  /* ================================================================
     髯具ｽｹ繝ｻ・ｺ鬯ｮ・｢隶鯉ｽ｢繝ｻ・ｨ繝ｻ・ｭ鬮ｫ・ｪ郢晢ｽｻ(Piecewise Mapping) 驕ｯ・ｶ郢晢ｽｻ髯ｷ鮃ｹ莠らｹ晢ｽｰ驛｢譎｢・ｽ・ｼ驛｢・ｧ繝ｻ・ｸ驛｢譎｢・ｽ・ｧ驛｢譎｢・ｽ・ｳ驍ｵ・ｺ繝ｻ・ｨ髯ｷ・ｷ陟包ｽ｡繝ｻ・ｸ・つ
     Approach: 0.00驕ｶ鄙ｫ繝ｻ.20 (20%)
     Read:     0.20驕ｶ鄙ｫ繝ｻ.75 (55%)
     Depart:   0.75驕ｶ鄙ｫ繝ｻ.00 (25%)
   ================================================================ */
  const APPROACH_END = 0.20;
  const READ_END     = 0.75;

  function getCardState(progress) {
    const raw = progress * N;
    const idx = Math.min(Math.floor(raw), N - 1);
    const localT = raw - idx;
    return { idx, localT };
  }

  function computeVisuals(localT) {
    let opacity, scale, rotY, zone, cameraBlend;
    if (localT <= APPROACH_END) {
      const t = localT / APPROACH_END;
      const e = easeOutCubic(t);
      opacity = e * 0.75;
      scale   = 1;
      rotY    = 0;
      zone    = 'approach';
      cameraBlend = t * 0.3;
    } else if (localT <= READ_END) {
      const t = (localT - APPROACH_END) / (READ_END - APPROACH_END);
      opacity = 0.75 + 0.25 * easeInOutSine(Math.min(t * 2, 1));
      scale   = 1;
      rotY    = 0;
      zone    = 'read';
      cameraBlend = 0.3 + t * 0.15;
    } else {
      const t = (localT - READ_END) / (1 - READ_END);
      const e = easeInCubic(t);
      opacity = 1.0 - e;
      scale   = localT > 0.94 ? 1 - ((localT - 0.94) / 0.06) * 0.03 : 1;
      rotY    = 0;
      zone    = 'depart';
      cameraBlend = 0.45 + t * 0.55;
    }
    return { opacity, scale, rotY, zone, cameraBlend };
  }

  function easeOutCubic(t){return 1-Math.pow(1-t,3)}
  function easeInCubic(t){return t*t*t}
  function easeInOutSine(t){return -(Math.cos(Math.PI*t)-1)/2}

  /* ================================================================
     ScrollTrigger 驕ｯ・ｶ郢晢ｽｻNO PIN, 鬮｢・ｾ繝ｻ・ｪ髴取ｻゑｽｽ・ｶ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｭ驛｢譎｢・ｽ・ｼ驛｢譎｢・ｽ・ｫ鬯ｨ・ｾ繝ｻ・｣髯ｷ髦ｪ繝ｻ
     ================================================================ */
  let targetProgress = 0, currentProgress = 0;
  let isInSection = false;
  let oneshotConsumed = false;

  ScrollTriggerRef.create({
    trigger: section,
    start: "top top",
    end: () => "+=" + Math.round(window.innerHeight * N * (VH_PER_CARD / 100)),
    pin: true,
    pinSpacing: true,
    scrub: 0.3,
    invalidateOnRefresh: true,
    onUpdate: self => {
      if (!oneshotConsumed) targetProgress = self.progress;
    },
    onEnter: () => { isInSection = true; },
    onLeave: (self) => {
      if (self.progress < 0.98) return;
      oneshotConsumed = true;
      isInSection = false;
      targetProgress = 1;
      currentProgress = Math.max(currentProgress, 0.995);

      if (progressEl) {
        progressEl.style.opacity = '0';
        progressEl.style.pointerEvents = 'none';
      }

      const historySection = document.getElementById('history-overview');
      if (historySection) {
        historySection.classList.add('section-in');
      }

      // Remove the pin spacer dead space now that all cards have been shown.
      // skip-zdive cancels margin-top: -100vh via CSS, then we kill the trigger
      // (removes pin spacer), hide the z-dive section, and jump to history top.
      requestAnimationFrame(() => {
        document.body.classList.add('skip-zdive');
        self.kill();
        section.style.display = 'none';
        requestAnimationFrame(() => {
          if (historySection) {
            window.scrollTo({ top: historySection.offsetTop, behavior: 'instant' });
          }
        });
      });
    },
    onEnterBack: () => { isInSection = !oneshotConsumed; },
    onLeaveBack: () => { isInSection = false; }
  });

  /* ---- Mouse ---- */
  const mouse = {x:0,y:0};
  window.addEventListener('mousemove',e=>{mouse.x=(e.clientX/W)*2-1;mouse.y=-(e.clientY/H)*2+1});

  /* ---- Animation loop ---- */
  const clock = new THREE.Clock();
  let cameraZ = 100;

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    currentProgress += (targetProgress - currentProgress) * 0.06;
    const { idx, localT } = getCardState(currentProgress);
    const vis = computeVisuals(localT);

    // 驛｢・ｧ繝ｻ・ｫ驛｢譎｢・ｽ・｡驛｢譎｢・ｽ・ｩZ (piecewise)
    const cardZPositions = panels.map((_,i) => -i * 600);
    let targetCamZ;
    if (idx < N - 1) {
      targetCamZ = cardZPositions[idx] + (cardZPositions[idx+1] - cardZPositions[idx]) * vis.cameraBlend;
    } else {
      targetCamZ = cardZPositions[N-1];
    }
    cameraZ += (targetCamZ - cameraZ) * 0.08;
    camera.position.z = 100 + cameraZ;

    // 髯ｷ闌ｨ・ｽ・ｨ驛｢譏懶ｽｻ・｣郢晢ｽｭ驛｢譎｢・ｽ・ｫ髫ｴ蜴・ｽｽ・ｴ髫ｴ繝ｻ・ｽ・ｰ
    for (let i = 0; i < N; i++) {
      const p = panels[i];
      const el = p.el;
      if (i === idx) {
        el.style.transform = `translate(-50%,-50%) translate(${p.xPx}px,0) scale(${vis.scale.toFixed(4)}) rotateY(${vis.rotY.toFixed(2)}deg)`;
        el.style.opacity = vis.opacity.toFixed(4);
        const exitBlur = vis.zone === 'depart' && localT > 0.94
          ? ((localT - 0.94) / 0.06) * 1.8
          : 0;
        el.style.filter = exitBlur > 0 ? `blur(${exitBlur.toFixed(1)}px)` : 'none';
        el.classList.toggle('read-active', vis.zone==='read');
      } else if (i < idx) {
        el.style.opacity='0';el.style.transform='translate(-50%,-50%) scale(0.96)';el.style.filter='none';el.classList.remove('read-active');
      } else {
        const dist = i - idx;
        if (dist===1 && localT>READ_END) {
          const earlyT=(localT-READ_END)/(1-READ_END);
          el.style.opacity=(earlyT*0.15).toFixed(4);
          el.style.transform=`translate(-50%,-50%) translate(${panels[i].xPx}px,0) scale(0.88) rotateY(${(i%2===0?-12:12)}deg)`;
        } else {
          el.style.opacity='0';el.style.transform='translate(-50%,-50%) scale(0.85)';
        }
        el.style.filter='none';el.classList.remove('read-active');
      }
    }

    // ---- Progress bar (viewport-fixed) ----
    if (progressEl) {
      // Show/hide based on section visibility
      progressEl.style.opacity = isInSection ? '1' : '0';
      progressEl.style.pointerEvents = isInSection ? 'auto' : 'none';

      // Fill bar width
      if (progressFill) {
        progressFill.style.width = (currentProgress * 100).toFixed(1) + '%';
      }
      // Counter text
      if (progressCounter) {
        const display = String(idx + 1).padStart(2,'0');
        const total   = String(N).padStart(2,'0');
        progressCounter.textContent = `${display} / ${total}`;
      }
    }

    // 鬮｢・ｭ隴ｴ・ｧ陷搾ｽｹ髮趣ｽｬ繝ｻ・ｮ鬯ｩ證ｮ・｡遘假ｽｻ繝ｻ繝ｻ闔・･・つ陷ｿ・･隰厄ｽｨ髯懃軸・ｫ繝ｻ・ｽ・ｻ繝ｻ・｢ 驕ｯ・ｶ郢晢ｽｻscene驍ｵ・ｺ繝ｻ・ｯ髯懃軸・ｫ繝ｻ・ｽ・ｻ繝ｻ・｢驍ｵ・ｺ髴域喚髮ｷ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
    floaters.forEach(m=>{
      const u = m.userData;
      m.rotation.x += u.rx + Math.sin(time * u.fx + u.px) * 0.0009;
      m.rotation.y += u.ry + Math.cos(time * u.fy + u.py) * 0.0009;
      m.rotation.z += u.rz;
      m.position.x = u.bx + Math.sin(time * u.fx + u.px) * u.ax * 0.18 + Math.cos(time * u.fx2 + u.px2) * u.ax * 0.12;
      m.position.y = u.by + Math.sin(time * u.fy + u.py) * u.ay * 0.55 + Math.sin(time * u.fy2 + u.py2) * u.ay * 0.45;
      m.position.z = u.bz + Math.cos(time * u.fz + u.pz) * u.az * 0.15 + Math.sin(time * u.fz2 + u.pz2) * u.az * 0.10;
    });
    // 驛｢譏懶ｽｻ・｣郢晢ｽｻ驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ・ｧ繝ｻ・ｯ驛｢譎｢・ｽ・ｫ驍ｵ・ｺ繝ｻ・ｰ驍ｵ・ｺ鬩｢謳ｾ・ｽ・ｷ繝ｻ・ｩ驛｢・ｧ郢晢ｽｻ・ゑｽｰ驍ｵ・ｺ繝ｻ・ｫ髯懃軸・ｫ繝ｻ・ｽ・ｻ繝ｻ・｢郢晢ｽｻ郢晢ｽｻcene髯ｷ闌ｨ・ｽ・ｨ髣厄ｽｴ髦ｮ蜷ｶ繝ｻ髯懃軸・ｫ繝ｻ・ｽ・ｻ繝ｻ・｢驍ｵ・ｺ陷会ｽｱ遶企・・ｸ・ｺ郢晢ｽｻ繝ｻ・ｼ郢晢ｽｻ
    particlesMesh.rotation.y=time*0.015;
    renderer.render(scene,camera);
  }
  animate();

  /* ---- Resize ---- */
  window.addEventListener('resize',()=>{
    W=window.innerWidth;H=window.innerHeight;
    camera.aspect=W/H;camera.updateProjectionMatrix();
    renderer.setSize(W,H);
    ScrollTriggerRef.refresh();
  });
}

/* ================================================================
   Overview Section 窶・Floating 3D Shapes Background
   ================================================================ */
function initOverviewShapes(sectionEl) {
  if (typeof window.THREE === 'undefined') return;
  const THREE = window.THREE;

  const canvas = document.createElement('canvas');
  canvas.id = 'overview-shapes-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  sectionEl.insertBefore(canvas, sectionEl.firstChild);

  let W = window.innerWidth, H = window.innerHeight;
  let isVisible = false;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xFFFFFF, 0.00035);

  const camera = new THREE.PerspectiveCamera(50, W / H, 1, 3000);
  camera.position.set(0, 0, 300);

  const geos = [
    new THREE.TetrahedronGeometry(40),  new THREE.OctahedronGeometry(35),   new THREE.IcosahedronGeometry(38),
    new THREE.TetrahedronGeometry(26),  new THREE.OctahedronGeometry(24),   new THREE.IcosahedronGeometry(28),
    new THREE.DodecahedronGeometry(32), new THREE.TetrahedronGeometry(18),  new THREE.OctahedronGeometry(22),
    new THREE.IcosahedronGeometry(25),  new THREE.DodecahedronGeometry(20), new THREE.TetrahedronGeometry(16)
  ];

  const floaters = [];
  for (let i = 0; i < 12; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0A2463, wireframe: true, transparent: true,
      opacity: 0.07 + Math.random() * 0.11
    });
    const mesh = new THREE.Mesh(geos[i % geos.length], mat);

    // Every 3rd shape is a "crossing" floater: starts at center, sweeps across with large slow X motion
    const isCrossing = (i % 3 === 0);
    mesh.position.set(
      isCrossing ? 0 : (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 350
    );
    mesh.userData = {
      rx: (Math.random() - 0.5) * 0.005,
      ry: (Math.random() - 0.5) * 0.005,
      rz: (Math.random() - 0.5) * 0.004,
      bx: mesh.position.x,
      by: mesh.position.y,
      bz: mesh.position.z,
      ax: isCrossing ? 550 + Math.random() * 250 : 160 + Math.random() * 280,
      ay: 130 + Math.random() * 270,
      az: 90  + Math.random() * 200,
      fx: isCrossing ? 0.02 + Math.random() * 0.04 : 0.08 + Math.random() * 0.18,
      fy: 0.10 + Math.random() * 0.25,
      fz: 0.07 + Math.random() * 0.22,
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      pz: Math.random() * Math.PI * 2,
      sway: 0.04 + Math.random() * 0.08,
      fx2: 0.03 + Math.random() * 0.08,
      fy2: 0.05 + Math.random() * 0.10,
      fz2: 0.04 + Math.random() * 0.08,
      px2: Math.random() * Math.PI * 2,
      py2: Math.random() * Math.PI * 2,
      pz2: Math.random() * Math.PI * 2
    };
    scene.add(mesh);
    floaters.push(mesh);
  }

  const clock = new THREE.Clock();

  function animateOverview() {
    requestAnimationFrame(animateOverview);
    if (!isVisible) return;
    const t = clock.getElapsedTime();
    floaters.forEach(m => {
      const u = m.userData;
      m.rotation.x += u.rx + Math.sin(t * u.fx + u.px) * 0.0008;
      m.rotation.y += u.ry + Math.cos(t * u.fy + u.py) * 0.0008;
      m.rotation.z += u.rz;
      m.position.x = u.bx + Math.sin(t * u.fx + u.px) * u.ax * 0.45 + Math.cos(t * u.fx2 + u.px2) * u.ax * 0.20;
      m.position.y = u.by + Math.sin(t * u.fy + u.py) * u.ay * 0.55 + Math.sin(t * u.fy2 + u.py2) * u.ay * 0.45;
      m.position.z = u.bz + Math.cos(t * u.fz + u.pz) * u.az * 0.18 + Math.sin(t * u.fz2 + u.pz2) * u.az * 0.10;
      const s = 1 + Math.sin(t * u.sway + u.py) * 0.04;
      m.scale.set(s, s, s);
    });
    renderer.render(scene, camera);
  }
  animateOverview();

  const setCanvasVisible = (v) => {
    isVisible = v;
    canvas.classList.toggle('is-visible', v);
  };

  if ('IntersectionObserver' in window) {
    let historyIn = false;
    let profileIn = false;

    const io = new IntersectionObserver(entries => {
      historyIn = entries.some(e => e.isIntersecting);
      setCanvasVisible(historyIn && !profileIn);
    }, { threshold: 0 });
    io.observe(sectionEl);

    // Hide when profile section is 40% into the viewport (shapes persist until user scrolls well into the profile section)
    const profileSection = document.getElementById('profile');
    if (profileSection) {
      const profileIO = new IntersectionObserver(entries => {
        profileIn = entries.some(e => e.isIntersecting);
        setCanvasVisible(historyIn && !profileIn);
      }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });
      profileIO.observe(profileSection);
    }
  } else {
    setCanvasVisible(true);
  }

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
}

/* ================================================================
   Timeline Generation & IntersectionObserver
   ================================================================ */
function buildHistoryOverview(items) {
  const root = document.getElementById('history-overview-timeline');
  const section = document.getElementById('history-overview');
  if (!root || !Array.isArray(items) || !items.length) return;

  if (section && typeof window.THREE !== 'undefined' && !document.getElementById('overview-shapes-canvas')) {
    initOverviewShapes(section);
  }

  root.innerHTML = `
    <div class="history-timeline">
      <div class="history-progress-line" aria-hidden="true"></div>
      <div class="timeline-header-block">
        <div class="timeline-title-group">
          <p class="timeline-main-title">沿革</p>
          <span class="timeline-title-line" aria-hidden="true"></span>
          <p class="timeline-subtitle">HISTORY</p>
        </div>
      </div>
    </div>
  `;
  const timeline = root.querySelector('.history-timeline');
  if (!timeline) return;
  const progressLine = timeline.querySelector('.history-progress-line');

  const photoIndexSet = pickOverviewPhotoIndices(items, 3);

  items.forEach((item, index) => {
    const article = document.createElement('article');
    article.className = 'history-item';
    article.dataset.year = String(item.era || '');
    article.style.setProperty('--year-tone', getYearToneColor(index, items.length));

    const shouldShowPhoto = photoIndexSet.has(index);
    const photoHtml = (shouldShowPhoto && item.image)
      ? `<figure class="overview-photo"><img src="${item.image}" alt="${escapeHtml(item.title || '')}" loading="lazy" onerror="this.parentElement.classList.add('overview-photo--empty')"></figure>`
      : '<figure class="overview-photo overview-photo--empty"></figure>';

    article.innerHTML = `
      <div class="history-left">
        <p class="history-year" aria-hidden="true">${escapeHtml(item.era || '')}</p>
      </div>
      <div class="history-center overview-center">
        <div class="history-content overview-content">
          <h3 class="history-title">${escapeHtml(item.title || '')}</h3>
          <p class="history-text">${formatHistoryBody(item.body || '')}</p>
        </div>
        ${photoHtml}
      </div>
    `;
    timeline.appendChild(article);
  });

  // Section entry animation: whole section zooms in from depth
  if (section) {
    if ('IntersectionObserver' in window) {
      const sectionIO = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          section.classList.add('section-in');
          sectionIO.disconnect();
        }
      }, { threshold: 0.05 });
      sectionIO.observe(section);
    } else {
      section.classList.add('section-in');
    }
  }

  if ('IntersectionObserver' in window) {
    const allItems = Array.from(root.querySelectorAll('.history-item'));
    const setActive = (activeIndex) => {
      allItems.forEach((el, idx) => {
        el.classList.toggle('active', idx === activeIndex);
      });
    };

    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = allItems.indexOf(entry.target);
          if (idx !== -1) setActive(idx);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });

    if (allItems.length) setActive(0);

    allItems.forEach((el) => {
      activeObserver.observe(el);
    });
  }

  if (progressLine) {
    if (section.__overviewProgressCleanup) {
      section.__overviewProgressCleanup();
      section.__overviewProgressCleanup = null;
    }
    section.__overviewProgressCleanup = setupOverviewProgressLine(section, timeline, progressLine);
  }
}

function getFoundationPhaseEnd(items) {
  const eras = items.map((item) => String(item.era || '').trim()).filter(Boolean);
  if (!eras.length) return 'PRESENT';
  if (eras.includes('1983')) return '1983';
  return eras[Math.min(2, eras.length - 1)];
}

function getYearToneColor(index, total) {
  const start = { r: 190, g: 192, b: 198 }; // gray
  const end = { r: 39, g: 58, b: 112 };     // deep blue
  const t = total > 1 ? (index / (total - 1)) : 0;
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function setupOverviewProgressLine(sectionEl, timelineEl, progressEl) {
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lineStartPx = 35;
  let rafId = 0;
  let sectionVisible = false;

  const update = () => {
    rafId = 0;
    const timelineRect = timelineEl.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const totalTrack = Math.max(0, timelineRect.height - lineStartPx);
    const triggerY = vh * 0.6;
    const progressed = triggerY - (timelineRect.top + lineStartPx);
    const progress = totalTrack > 0 ? clamp(progressed / totalTrack, 0, 1) : 0;
    progressEl.style.height = `${Math.max(0, totalTrack * progress).toFixed(2)}px`;

    // Keep looping while section is visible for smooth tracking
    if (sectionVisible) {
      rafId = requestAnimationFrame(update);
    }
  };

  const scheduleUpdate = () => {
    if (!rafId) rafId = requestAnimationFrame(update);
  };

  // Use IntersectionObserver to start/stop the RAF loop
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      sectionVisible = entries.some(e => e.isIntersecting);
      if (sectionVisible) scheduleUpdate();
    }, { threshold: 0 });
    io.observe(sectionEl);
  } else {
    sectionVisible = true;
    scheduleUpdate();
  }

  // Also fire on scroll for immediate response (e.g. after GSAP unpin)
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  scheduleUpdate();

  return () => {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
  };
}

function pickOverviewPhotoIndices(items, maxCount) {
  const candidates = items
    .map((item, index) => ({ item, index }))
    .filter(entry => !!entry.item.image)
    .map(entry => entry.index);

  if (!candidates.length || maxCount <= 0) return new Set();
  if (candidates.length <= maxCount) return new Set(candidates);

  const picked = [];
  for (let i = 0; i < maxCount; i++) {
    const pos = Math.round((i * (candidates.length - 1)) / (maxCount - 1));
    picked.push(candidates[pos]);
  }
  return new Set(picked);
}

function formatHistoryBody(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (normalized.includes('\n')) {
    return escapeHtml(normalized).replace(/\n+/g, '<br>');
  }
  return escapeHtml(normalized).replace(/。(?=.)/g, '。<br>');
}

function escapeHtml(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/[&<>"']/g, (match) => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[match];
  });
}









