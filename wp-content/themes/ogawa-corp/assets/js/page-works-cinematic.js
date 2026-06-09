(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, alpha) {
    return start + (end - start) * alpha;
  }

  function initReducedMotionFallback(root) {
    var media = window.matchMedia("(prefers-reduced-motion: reduce)");

    function apply() {
      root.classList.toggle("is-reduced-motion", media.matches);
    }

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
    } else if (typeof media.addListener === "function") {
      media.addListener(apply);
    }

    return {
      prefersReducedMotion: function () {
        return media.matches;
      }
    };
  }

  function initFloatingPhysics(scene, camera, options) {
    var THREE = window.THREE;
    var anchors = options.anchors || [];
    var count = Math.max(0, options.count || 0);
    var objects = [];
    var pointerNdc = new THREE.Vector2(0, 0);
    var pointerActive = false;
    var unpackVector = new THREE.Vector3();
    var unpackDirection = new THREE.Vector3();
    var activeCount = count;
    var spreadScale = 1;
    var anchorScaleX = 1;
    var anchorScaleY = 1;

    if (!anchors.length || !count) {
      return {
        setPointerFromClient: function () {},
        clearPointer: function () {},
        update: function () {},
        applyProfile: function () {},
        destroy: function () {}
      };
    }

    var geometries = [
      new THREE.BoxGeometry(0.78, 0.78, 0.78),
      new THREE.TorusGeometry(0.52, 0.16, 14, 42),
      new THREE.IcosahedronGeometry(0.56, 0)
    ];

    for (var i = 0; i < count; i += 1) {
      var baseAnchor = anchors[i % anchors.length].clone();
      var mesh = new THREE.Mesh(
        geometries[i % geometries.length],
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0xc5a059 : 0x9cb7dd,
          emissive: i % 2 === 0 ? 0x2f220c : 0x182336,
          emissiveIntensity: 0.85,
          roughness: 0.34,
          metalness: 0.58
        })
      );

      var offset = new THREE.Vector3(
        (Math.random() - 0.5) * 7.6,
        (Math.random() - 0.5) * 4.6,
        (Math.random() - 0.5) * 14
      );

      mesh.position.copy(baseAnchor).add(offset);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      scene.add(mesh);

      objects.push({
        mesh: mesh,
        baseAnchor: baseAnchor.clone(),
        anchor: mesh.position.clone(),
        offset: offset.clone(),
        velocity: new THREE.Vector3(),
        phase: Math.random() * Math.PI * 2,
        floatAmp: 0.22 + Math.random() * 0.56,
        spring: 0.6 + Math.random() * 0.85,
        damping: 0.88 + Math.random() * 0.08
      });
    }

    function applyProfile(profile) {
      var nextCount = count;
      if (profile && Number.isFinite(profile.count)) {
        nextCount = profile.count;
      }
      activeCount = clamp(Math.round(nextCount), 0, objects.length);

      spreadScale = profile && Number.isFinite(profile.spreadScale) ? profile.spreadScale : 1;
      anchorScaleX = profile && Number.isFinite(profile.anchorScaleX) ? profile.anchorScaleX : 1;
      anchorScaleY = profile && Number.isFinite(profile.anchorScaleY) ? profile.anchorScaleY : 1;

      objects.forEach(function (item, index) {
        var isActive = index < activeCount;
        item.mesh.visible = isActive;
        item.anchor.set(
          item.baseAnchor.x * anchorScaleX + item.offset.x * spreadScale,
          item.baseAnchor.y * anchorScaleY + item.offset.y * spreadScale,
          item.baseAnchor.z + item.offset.z * spreadScale
        );

        if (!isActive) {
          item.velocity.set(0, 0, 0);
        }
      });
    }

    function getPointerWorldAtZ(ndcX, ndcY, zDepth) {
      unpackVector.set(ndcX, ndcY, 0.5).unproject(camera);
      unpackDirection.copy(unpackVector).sub(camera.position).normalize();

      if (Math.abs(unpackDirection.z) < 0.00001) {
        return null;
      }

      var distance = (zDepth - camera.position.z) / unpackDirection.z;
      if (!Number.isFinite(distance) || distance < 0) {
        return null;
      }

      return camera.position.clone().add(unpackDirection.multiplyScalar(distance));
    }

    function setPointerFromClient(clientX, clientY, rect) {
      if (!rect || !rect.width || !rect.height) {
        return;
      }

      pointerNdc.x = clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerNdc.y = clamp(-(((clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
      pointerActive = true;
    }

    function clearPointer() {
      pointerActive = false;
    }

    function update(delta, time) {
      var force = new THREE.Vector3();
      var desired = new THREE.Vector3();

      objects.forEach(function (item) {
        if (!item.mesh.visible) {
          return;
        }

        desired.copy(item.anchor);
        desired.x += Math.sin(time * 0.65 + item.phase) * item.floatAmp;
        desired.y += Math.cos(time * 0.58 + item.phase) * item.floatAmp * 0.7;
        desired.z += Math.sin(time * 0.72 + item.phase) * item.floatAmp * 1.4;

        force.copy(desired).sub(item.mesh.position).multiplyScalar(item.spring);

        if (pointerActive) {
          var pointerWorld = getPointerWorldAtZ(pointerNdc.x, pointerNdc.y, item.mesh.position.z);
          if (pointerWorld) {
            var deltaToPointer = item.mesh.position.clone().sub(pointerWorld);
            var distance = deltaToPointer.length();
            var repelRadius = 2.35;

            if (distance > 0.0001 && distance < repelRadius) {
              var repelStrength = (repelRadius - distance) / repelRadius;
              force.add(deltaToPointer.normalize().multiplyScalar(repelStrength * 11.5));
            }
          }
        }

        item.velocity.add(force.multiplyScalar(delta));
        item.velocity.multiplyScalar(item.damping);
        item.mesh.position.add(item.velocity.clone().multiplyScalar(delta * 5.2));

        item.mesh.rotation.x += delta * 0.32;
        item.mesh.rotation.y += delta * 0.42;
      });
    }

    applyProfile(options.profile || null);

    function destroy() {
      objects.forEach(function (item) {
        scene.remove(item.mesh);
        if (item.mesh.geometry) {
          item.mesh.geometry.dispose();
        }
        if (item.mesh.material) {
          item.mesh.material.dispose();
        }
      });

      geometries.forEach(function (geometry) {
        geometry.dispose();
      });
    }

    return {
      setPointerFromClient: setPointerFromClient,
      clearPointer: clearPointer,
      update: update,
      applyProfile: applyProfile,
      destroy: destroy
    };
  }

  function initMuseumScene(root, prefersReducedMotion) {
    var museum = root.querySelector("[data-okg-museum]");
    var stage = root.querySelector("[data-okg-museum-stage]");
    var canvas = root.querySelector("[data-okg-museum-canvas]");
    var panelElements = Array.prototype.slice.call(root.querySelectorAll("[data-okg-panel]"));

    if (!museum || !stage || !canvas || !panelElements.length) {
      return null;
    }

    function updatePanelVisibility(progress) {
      var cameraDepth = lerp(0, 86, progress);

      panelElements.forEach(function (panel) {
        var depth = parseFloat(panel.getAttribute("data-depth"));
        if (!Number.isFinite(depth)) {
          depth = 0;
        }

        var distance = Math.abs(depth - cameraDepth);
        var visibility = clamp(1 - distance / 24, 0.08, 1);
        panel.style.setProperty("--okg-panel-visibility", visibility.toFixed(3));
      });
    }

    if (prefersReducedMotion || typeof window.THREE === "undefined") {
      root.classList.add("is-webgl-disabled");
      updatePanelVisibility(0.45);

      return {
        setProgress: function (progress) {
          updatePanelVisibility(progress);
        },
        destroy: function () {}
      };
    }

    var THREE = window.THREE;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 240);
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    var animationId = 0;
    var lastFrameTime = performance.now();
    var isVisible = true;
    var isIntersecting = true;
    var observer = null;
    var pointerRect = null;
    var cameraLookAt = new THREE.Vector3(0, 0, -62);
    var panelMeshes = [];
    var panelMaterialFallbackColor = 0x2a3448;
    var currentLayoutProfile = null;
    var spMedia = window.matchMedia("(max-width: 768px)");

    function getLayoutProfile() {
      if (spMedia.matches) {
        return {
          fov: 58,
          cameraStart: 34,
          cameraEnd: -66,
          panelScale: 0.56,
          panelXFactor: 0.34,
          panelYFactor: 0.82,
          pixelRatioCap: 1.5,
          floatingCount: 8,
          floatingSpread: 0.55,
          driftX: 0.52,
          driftY: 0.3
        };
      }

      return {
        fov: 45,
        cameraStart: 26,
        cameraEnd: -88,
        panelScale: 1,
        panelXFactor: 1,
        panelYFactor: 1,
        pixelRatioCap: 1.75,
        floatingCount: window.matchMedia("(max-width: 900px)").matches ? 12 : 22,
        floatingSpread: 1,
        driftX: 0.85,
        driftY: 0.45
      };
    }

    scene.fog = new THREE.Fog(0x171c28, 14, 108);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    if ("outputEncoding" in renderer && window.THREE.sRGBEncoding) {
      renderer.outputEncoding = window.THREE.sRGBEncoding;
    }

    camera.position.set(0, 0, 26);

    var ambientLight = new THREE.AmbientLight(0xaec6e8, 0.74);
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.08);
    keyLight.position.set(-6, 8, 14);

    var rimLight = new THREE.DirectionalLight(0xc5a059, 0.62);
    rimLight.position.set(8, -3, -10);

    scene.add(ambientLight);
    scene.add(keyLight);
    scene.add(rimLight);

    var textureLoader = new THREE.TextureLoader();

    panelElements.forEach(function (panel) {
      var depth = parseFloat(panel.getAttribute("data-depth"));
      var posX = parseFloat(panel.getAttribute("data-x"));
      var posY = parseFloat(panel.getAttribute("data-y"));
      var imageUrl = panel.getAttribute("data-image") || "";

      if (!Number.isFinite(depth)) {
        depth = 0;
      }
      if (!Number.isFinite(posX)) {
        posX = 0;
      }
      if (!Number.isFinite(posY)) {
        posY = 0;
      }

      var geometry = new THREE.PlaneGeometry(9.4, 5.8, 1, 1);
      var material = new THREE.MeshStandardMaterial({
        color: panelMaterialFallbackColor,
        roughness: 0.72,
        metalness: 0.14,
        emissive: 0x111722,
        emissiveIntensity: 0.3
      });

      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(posX, posY, -depth);
      scene.add(mesh);

      if (imageUrl) {
        textureLoader.load(
          imageUrl,
          function (texture) {
            if ("encoding" in texture && window.THREE.sRGBEncoding) {
              texture.encoding = window.THREE.sRGBEncoding;
            }
            material.map = texture;
            material.needsUpdate = true;
          },
          undefined,
          function () {}
        );
      }

      panelMeshes.push({
        depth: depth,
        sourceDepth: depth,
        sourceX: posX,
        sourceY: posY,
        mesh: mesh,
        geometry: geometry,
        material: material
      });
    });

    var anchors = panelMeshes.map(function (panelMesh) {
      return new THREE.Vector3(panelMesh.sourceX, panelMesh.sourceY, -panelMesh.sourceDepth);
    });

    var initialProfile = getLayoutProfile();
    var floating = initFloatingPhysics(scene, camera, {
      anchors: anchors,
      count: 22,
      profile: {
        count: initialProfile.floatingCount,
        spreadScale: initialProfile.floatingSpread,
        anchorScaleX: initialProfile.panelXFactor,
        anchorScaleY: initialProfile.panelYFactor
      }
    });

    function applyLayoutProfile(profile) {
      currentLayoutProfile = profile;

      panelMeshes.forEach(function (panelMesh) {
        panelMesh.mesh.scale.set(profile.panelScale, profile.panelScale, 1);
        panelMesh.mesh.position.set(
          panelMesh.sourceX * profile.panelXFactor,
          panelMesh.sourceY * profile.panelYFactor,
          -panelMesh.sourceDepth
        );
      });

      floating.applyProfile({
        count: profile.floatingCount,
        spreadScale: profile.floatingSpread,
        anchorScaleX: profile.panelXFactor,
        anchorScaleY: profile.panelYFactor
      });
    }

    function resizeRenderer() {
      var width = Math.max(stage.clientWidth, 1);
      var height = Math.max(stage.clientHeight, 1);
      var profile = getLayoutProfile();

      applyLayoutProfile(profile);
      camera.fov = profile.fov;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, profile.pixelRatioCap));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      pointerRect = stage.getBoundingClientRect();
    }

    function setProgress(progress) {
      var normalized = clamp(progress, 0, 1);
      var profile = currentLayoutProfile || getLayoutProfile();
      var cameraStart = profile.cameraStart;
      var cameraEnd = profile.cameraEnd;

      camera.position.z = lerp(cameraStart, cameraEnd, normalized);
      root.style.setProperty("--okg-works-museum-progress", normalized.toFixed(4));
      updatePanelVisibility(normalized);
    }

    function onPointerMove(event) {
      if (!pointerRect) {
        pointerRect = stage.getBoundingClientRect();
      }
      floating.setPointerFromClient(event.clientX, event.clientY, pointerRect);
    }

    function onPointerLeave() {
      floating.clearPointer();
    }

    function animate(now) {
      animationId = window.requestAnimationFrame(animate);

      if (!isVisible || !isIntersecting) {
        lastFrameTime = now;
        return;
      }

      var delta = Math.min((now - lastFrameTime) / 1000, 0.033);
      lastFrameTime = now;

      var time = now * 0.001;
      var profile = currentLayoutProfile || getLayoutProfile();
      floating.update(delta, time + parseFloat(root.style.getPropertyValue("--okg-works-museum-progress") || "0"));

      camera.position.x = Math.sin(time * 0.18) * profile.driftX;
      camera.position.y = Math.cos(time * 0.14) * profile.driftY;
      camera.lookAt(cameraLookAt);

      renderer.render(scene, camera);
    }

    function onVisibilityChange() {
      isVisible = !document.hidden;
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        function (entries) {
          if (!entries.length) {
            return;
          }
          isIntersecting = entries[0].isIntersecting;
        },
        { threshold: 0.06 }
      );
      observer.observe(museum);
    }

    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("resize", resizeRenderer);
    document.addEventListener("visibilitychange", onVisibilityChange);

    resizeRenderer();
    setProgress(0);
    animationId = window.requestAnimationFrame(animate);

    function destroy() {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }

      if (observer) {
        observer.disconnect();
      }

      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resizeRenderer);
      document.removeEventListener("visibilitychange", onVisibilityChange);

      floating.destroy();

      panelMeshes.forEach(function (item) {
        scene.remove(item.mesh);
        item.geometry.dispose();
        item.material.dispose();
      });

      renderer.dispose();
    }

    return {
      setProgress: setProgress,
      destroy: destroy
    };
  }

  function initMuseumScroll(root, museumController, prefersReducedMotion) {
    if (!museumController) {
      return function () {};
    }

    var museum = root.querySelector("[data-okg-museum]");
    var stage = root.querySelector("[data-okg-museum-stage]");
    var scannerSection = root.querySelector("[data-okg-scanner-section]");

    if (!museum || !stage) {
      return function () {};
    }

    if (prefersReducedMotion || typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      museumController.setProgress(0.48);
      return function () {};
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    var progressState = { value: 0 };

    var progressTween = window.gsap.to(progressState, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: museum,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.9,
        pin: stage,
        pinSpacing: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: function () {
          museumController.setProgress(progressState.value);
        }
      }
    });

    var revealTween = null;
    if (scannerSection) {
      revealTween = window.gsap.fromTo(
        scannerSection,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: scannerSection,
            start: "top 82%",
            once: true
          }
        }
      );
    }

    return function destroyScroll() {
      if (progressTween) {
        progressTween.kill();
      }
      if (revealTween) {
        revealTween.kill();
      }
    };
  }

  function initBlueprintScanner(root, prefersReducedMotion) {
    var scanner = root.querySelector("[data-okg-scanner]");
    if (!scanner) {
      return null;
    }

    var maxRadius = parseFloat(scanner.getAttribute("data-scan-radius"));
    if (!Number.isFinite(maxRadius) || maxRadius <= 0) {
      maxRadius = 150;
    }

    var isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    var activeRadius = isCoarsePointer ? maxRadius * 0.78 : maxRadius;
    var restRadius = isCoarsePointer ? activeRadius * 0.72 : 0;

    var rect = scanner.getBoundingClientRect();
    var centerX = rect.width / 2;
    var centerY = rect.height / 2;

    var state = {
      x: centerX,
      y: centerY,
      targetX: centerX,
      targetY: centerY,
      radius: restRadius,
      targetRadius: restRadius,
      draggingTouch: false,
      pointerActive: false
    };

    function refreshRect() {
      rect = scanner.getBoundingClientRect();
      centerX = rect.width / 2;
      centerY = rect.height / 2;
    }

    function setTargetFromClient(clientX, clientY) {
      state.targetX = clamp(clientX - rect.left, 0, rect.width);
      state.targetY = clamp(clientY - rect.top, 0, rect.height);
    }

    function setVars() {
      scanner.style.setProperty("--okg-works-scan-x", state.x.toFixed(2) + "px");
      scanner.style.setProperty("--okg-works-scan-y", state.y.toFixed(2) + "px");
      scanner.style.setProperty("--okg-works-scan-r", state.radius.toFixed(2) + "px");
    }

    function setIdle() {
      state.pointerActive = false;
      state.targetRadius = restRadius;
      if (isCoarsePointer) {
        scanner.classList.add("is-touch-rest");
      }
      scanner.classList.remove("is-active");
    }

    function setActive() {
      state.pointerActive = true;
      state.targetRadius = activeRadius;
      scanner.classList.add("is-active");
      scanner.classList.remove("is-touch-rest");
    }

    if (prefersReducedMotion) {
      scanner.classList.add("is-touch-rest");
      state.targetX = centerX;
      state.targetY = centerY;
      state.x = centerX;
      state.y = centerY;
      state.targetRadius = activeRadius * 0.76;
      state.radius = state.targetRadius;
      setVars();

      return {
        destroy: function () {}
      };
    }

    if (!isCoarsePointer) {
      state.targetRadius = 0;
      state.radius = 0;
    }

    function onPointerEnter(event) {
      if (event.pointerType === "touch") {
        return;
      }
      refreshRect();
      setActive();
      setTargetFromClient(event.clientX, event.clientY);
    }

    function onPointerMove(event) {
      refreshRect();

      if (event.pointerType === "touch" && !state.draggingTouch) {
        return;
      }

      setActive();
      setTargetFromClient(event.clientX, event.clientY);
    }

    function onPointerLeave(event) {
      if (event.pointerType === "touch") {
        return;
      }
      setIdle();
    }

    function onPointerDown(event) {
      refreshRect();
      if (event.pointerType === "touch") {
        state.draggingTouch = true;
      }

      setActive();
      setTargetFromClient(event.clientX, event.clientY);

      if (typeof scanner.setPointerCapture === "function") {
        try {
          scanner.setPointerCapture(event.pointerId);
        } catch (error) {
          // Ignore unsupported capture failures.
        }
      }
    }

    function onPointerEnd(event) {
      if (event.pointerType === "touch") {
        state.draggingTouch = false;
        scanner.classList.add("is-touch-rest");
        scanner.classList.remove("is-active");
        state.targetRadius = restRadius;
      } else {
        setIdle();
      }

      if (typeof scanner.releasePointerCapture === "function") {
        try {
          if (scanner.hasPointerCapture(event.pointerId)) {
            scanner.releasePointerCapture(event.pointerId);
          }
        } catch (error) {
          // Ignore unsupported release failures.
        }
      }
    }

    scanner.addEventListener("pointerenter", onPointerEnter);
    scanner.addEventListener("pointermove", onPointerMove);
    scanner.addEventListener("pointerleave", onPointerLeave);
    scanner.addEventListener("pointerdown", onPointerDown);
    scanner.addEventListener("pointerup", onPointerEnd);
    scanner.addEventListener("pointercancel", onPointerEnd);

    var rafId = 0;

    function tick(now) {
      rafId = window.requestAnimationFrame(tick);

      refreshRect();

      if (isCoarsePointer && !state.draggingTouch && !state.pointerActive) {
        state.targetX = centerX + Math.sin(now * 0.00034) * rect.width * 0.24;
        state.targetY = centerY + Math.cos(now * 0.00028) * rect.height * 0.2;
      }

      state.x = lerp(state.x, state.targetX, 0.17);
      state.y = lerp(state.y, state.targetY, 0.17);
      state.radius = lerp(state.radius, state.targetRadius, 0.18);

      setVars();
    }

    setIdle();
    setVars();
    rafId = window.requestAnimationFrame(tick);

    function onResize() {
      refreshRect();
      if (!state.pointerActive && !state.draggingTouch) {
        state.targetX = centerX;
        state.targetY = centerY;
      }
    }

    window.addEventListener("resize", onResize);

    return {
      destroy: function () {
        window.cancelAnimationFrame(rafId);
        scanner.removeEventListener("pointerenter", onPointerEnter);
        scanner.removeEventListener("pointermove", onPointerMove);
        scanner.removeEventListener("pointerleave", onPointerLeave);
        scanner.removeEventListener("pointerdown", onPointerDown);
        scanner.removeEventListener("pointerup", onPointerEnd);
        scanner.removeEventListener("pointercancel", onPointerEnd);
        window.removeEventListener("resize", onResize);
      }
    };
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("okg-works");
    if (!root) {
      return;
    }

    var reducedMotionController = initReducedMotionFallback(root);
    var prefersReducedMotion = reducedMotionController.prefersReducedMotion();

    var museumController = initMuseumScene(root, prefersReducedMotion);
    var destroyMuseumScroll = initMuseumScroll(root, museumController, prefersReducedMotion);
    var scannerController = initBlueprintScanner(root, prefersReducedMotion);

    window.addEventListener(
      "pagehide",
      function () {
        if (museumController && typeof museumController.destroy === "function") {
          museumController.destroy();
        }

        if (typeof destroyMuseumScroll === "function") {
          destroyMuseumScroll();
        }

        if (scannerController && typeof scannerController.destroy === "function") {
          scannerController.destroy();
        }
      },
      { once: true }
    );
  });
})();
