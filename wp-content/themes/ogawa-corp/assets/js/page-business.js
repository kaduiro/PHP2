(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector(".okg-bizhub");
    if (!root) {
      return;
    }

    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var canUsePointerTracking = !prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var stageIntro = root.querySelector("#stage01");

    if (stageIntro) {
      var stageScrollRaf = 0;
      var updateStageDim = function () {
        root.classList.toggle("is-stage-dimmed", window.scrollY > 21);
        stageScrollRaf = 0;
      };
      var requestStageDimUpdate = function () {
        if (stageScrollRaf) {
          return;
        }

        stageScrollRaf = window.requestAnimationFrame(updateStageDim);
      };

      updateStageDim();
      window.addEventListener("scroll", requestStageDimUpdate, { passive: true });
    }

    if (canUsePointerTracking) {
      var rafId = 0;
      var nextX = "50%";
      var nextY = "35%";

      var updateSpotlight = function () {
        root.style.setProperty("--okg-spot-x", nextX);
        root.style.setProperty("--okg-spot-y", nextY);
        rafId = 0;
      };

      root.addEventListener(
        "mousemove",
        function (event) {
          var rect = root.getBoundingClientRect();
          if (!rect.width || !rect.height) {
            return;
          }

          var x = ((event.clientX - rect.left) / rect.width) * 100;
          var y = ((event.clientY - rect.top) / rect.height) * 100;

          nextX = clamp(x, 0, 100).toFixed(2) + "%";
          nextY = clamp(y, 0, 100).toFixed(2) + "%";

          if (!rafId) {
            rafId = window.requestAnimationFrame(updateSpotlight);
          }
        },
        { passive: true }
      );

      root.addEventListener("mouseleave", function () {
        nextX = "50%";
        nextY = "35%";

        if (!rafId) {
          rafId = window.requestAnimationFrame(updateSpotlight);
        }
      });
    } else {
      root.style.setProperty("--okg-spot-opacity", "0");
    }

    var assembleSections = Array.prototype.slice.call(root.querySelectorAll(
      ".okg-bizhub__section--wood, .okg-bizhub__section--real-estate, .okg-bizhub__section--exterior"
    ));
    if (!assembleSections.length) {
      return;
    }

    var assemble = function (section) {
      section.classList.add("is-assembled");
    };

    if (prefersReducedMotion) {
      assembleSections.forEach(assemble);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      assembleSections.forEach(assemble);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            assemble(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.34,
        rootMargin: "0px 0px -10% 0px"
      }
    );

    assembleSections.forEach(function (section) {
      observer.observe(section);
    });
  });
})();
