"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Every scroll-driven moment on V4 lives here: Lenis smooth scrolling, the
 * preloader, the hero folding into a card, the manifesto lighting up word by
 * word, the sideways work reel, stacking service cards, the velocity marquee,
 * the theme shifting between sections, and the magnetic contact button.
 *
 * It only animates transform and opacity (plus a clip-path on one image), so the
 * page scrolls on the compositor. With reduced motion, none of it runs.
 */
export function Experience() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".v4-root");
    if (!root) return;
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The loader is React-owned: hide it with CSS (data-ready), never detach it.
    if (reduced) {
      root.dataset.ready = "true";
      return;
    }
    let disposed = false;

    /* ------------------------------------------------------------- scroll */

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    // In-page links glide instead of jumping.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || event.metaKey || event.ctrlKey) return;
      const id = link.getAttribute("href")!;
      const target = id === "#main-content" ? 0 : root.querySelector<HTMLElement>(id);
      if (target === null) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    };
    root.addEventListener("click", onClick);

    const ctx = gsap.context(() => {
      /* ---------------------------------------------------------- preloader */

      const chars = gsap.utils.toArray<HTMLElement>(".v4-char");
      gsap.set(chars, { yPercent: 115, rotate: 6 });
      gsap.set(".v4-fade", { autoAlpha: 0, y: 24 });
      gsap.set(".v4-nav", { autoAlpha: 0, y: -16 });

      const counter = { value: 0 };
      const countEl = root.querySelector<HTMLElement>(".v4-loader__count span");
      const intro = gsap.timeline({ paused: true });
      intro
        .to(counter, {
          value: 100,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            if (countEl) countEl.textContent = String(Math.round(counter.value)).padStart(3, "0");
          },
        })
        .to(".v4-loader__bar i", { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
        .to(".v4-loader__count, .v4-loader__top", { yPercent: -40, autoAlpha: 0, duration: 0.5, ease: "power3.in" })
        .to(".v4-loader", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, "-=0.15")
        .to(chars, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.035, ease: "expo.out" }, "-=0.55")
        .to(".v4-fade", { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "power3.out" }, "-=1.0")
        .to(".v4-nav", { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, "<")
        .add(() => {
          root.dataset.ready = "true";
          lenis.start();
          ScrollTrigger.refresh();
        });
      // Start once fonts are in (or after a beat), so the counter is not fiction.
      Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 1200))]).then(() => {
        if (!disposed) intro.play();
      });

      /* --------------------------------------------------------------- hero */

      gsap.timeline({
        scrollTrigger: { trigger: ".v4-hero", start: "top top", end: "+=100%", scrub: true, pin: true, pinSpacing: true },
      })
        .to(".v4-hero__frame", { scale: 0.86, borderRadius: 36, ease: "none" }, 0)
        .to(".v4-hero__title", { yPercent: -18, ease: "none" }, 0)
        .to(".v4-hero__meta, .v4-hero__kicker, .v4-hero__scroll", { autoAlpha: 0, y: -40, ease: "none" }, 0);

      /* ---------------------------------------------------------- headings */

      gsap.utils.toArray<HTMLElement>(".v4-heading, .v4-contact__title").forEach((heading) => {
        gsap.from(heading.querySelectorAll(".v4-word > span"), {
          yPercent: 110,
          rotate: 4,
          duration: 1.2,
          stagger: 0.06,
          ease: "expo.out",
          scrollTrigger: { trigger: heading, start: "top 85%" },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.from(element, { autoAlpha: 0, y: 40, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%" } });
      });

      /* ----------------------------------------------------------- manifesto */

      gsap.fromTo(
        ".v4-lit",
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.12,
          ease: "none",
          scrollTrigger: { trigger: ".v4-manifesto__statement", start: "top 78%", end: "bottom 42%", scrub: true },
        },
      );
      gsap.fromTo(
        ".v4-portrait__mask",
        { clipPath: "inset(22% 26% 22% 26% round 28px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          ease: "none",
          scrollTrigger: { trigger: ".v4-portrait", start: "top 85%", end: "center 45%", scrub: true },
        },
      );
      gsap.fromTo(
        ".v4-portrait__mask img",
        { scale: 1.35 },
        { scale: 1, ease: "none", scrollTrigger: { trigger: ".v4-portrait", start: "top bottom", end: "bottom top", scrub: true } },
      );
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((element) => {
        const target = Number(element.dataset.count) || 0;
        const state = { value: 0 };
        element.textContent = "0";
        gsap.to(state, {
          value: target,
          duration: 1.8,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 90%" },
          onUpdate: () => {
            element.textContent = Math.round(state.value).toLocaleString();
          },
        });
      });

      /* ---------------------------------------------- work, services, marquee */

      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const track = root.querySelector<HTMLElement>(".v4-work__track");
        if (!track) return;
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
        const reel = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".v4-work",
            start: "top top",
            end: () => `+=${distance()}`,
            pin: ".v4-work__pin",
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(".v4-work__progress i", { scaleX: self.progress }),
          },
        });
        // Each screenshot slides a little against its card: parallax within the reel.
        gsap.utils.toArray<HTMLElement>(".v4-card__media img").forEach((image) => {
          gsap.fromTo(
            image,
            { xPercent: -7, scale: 1.18 },
            {
              xPercent: 7,
              scale: 1.18,
              ease: "none",
              scrollTrigger: { trigger: image.closest(".v4-card"), containerAnimation: reel, start: "left right", end: "right left", scrub: true },
            },
          );
        });
      });
      mm.add("(max-width: 899px)", () => {
        gsap.utils.toArray<HTMLElement>(".v4-card").forEach((card) => {
          gsap.from(card, { autoAlpha: 0, y: 60, duration: 1, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 90%" } });
        });
      });

      // Each service card sinks back as the next one slides over it.
      const cards = gsap.utils.toArray<HTMLElement>(".v4-stack__card");
      cards.forEach((card, index) => {
        const next = cards[index + 1];
        if (!next) return;
        // Scale only: fading would make the solid card see-through.
        gsap.to(card, {
          scale: 0.92,
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
        });
      });

      // The marquee: always drifting, faster and leaning while you scroll.
      const rows = gsap.utils.toArray<HTMLElement>(".v4-marquee__row").map((row) => ({
        track: row.querySelector<HTMLElement>(".v4-marquee__track")!,
        direction: Number(row.dataset.direction) || 1,
        x: 0,
      }));
      let skew = 0;
      const drift = () => {
        const velocity = lenis.velocity || 0;
        skew += (gsap.utils.clamp(-8, 8, velocity * 0.35) - skew) * 0.12;
        for (const row of rows) {
          const half = row.track.scrollWidth / 2;
          if (!half) continue;
          row.x -= (0.6 + Math.abs(velocity) * 0.25) * row.direction;
          row.x = gsap.utils.wrap(-half, 0, row.x);
          row.track.style.transform = `translate3d(${row.x.toFixed(2)}px, 0, 0) skewX(${(-skew * row.direction).toFixed(2)}deg)`;
        }
      };
      ScrollTrigger.create({
        trigger: ".v4-marquee",
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? gsap.ticker.add(drift) : gsap.ticker.remove(drift)),
      });

      /* -------------------------------------------------------------- theme */

      // The page colour follows the section in the middle of the screen.
      gsap.utils.toArray<HTMLElement>("[data-theme]").forEach((section) => {
        if (section === root) return;
        ScrollTrigger.create({
          trigger: section,
          // The footer is short and sits at the very end: it takes over earlier.
          start: section.classList.contains("v4-footer") ? "top 85%" : "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) root.dataset.theme = section.dataset.theme;
          },
        });
      });
    }, root);

    /* ------------------------------------------------------------ magnetic */

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const magnets = Array.from(root.querySelectorAll<HTMLElement>("[data-magnetic]"));
    const cleanups = magnets.map((magnet) => {
      if (!fine) return () => undefined;
      const label = magnet.querySelector<HTMLElement>(".v4-magnet__label");
      const moveX = gsap.quickTo(magnet, "x", { duration: 0.6, ease: "power3.out" });
      const moveY = gsap.quickTo(magnet, "y", { duration: 0.6, ease: "power3.out" });
      const labelX = label ? gsap.quickTo(label, "x", { duration: 0.6, ease: "power3.out" }) : null;
      const labelY = label ? gsap.quickTo(label, "y", { duration: 0.6, ease: "power3.out" }) : null;
      const onMove = (event: PointerEvent) => {
        const box = magnet.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        moveX(dx * 0.35);
        moveY(dy * 0.35);
        labelX?.(dx * 0.18);
        labelY?.(dy * 0.18);
      };
      const onLeave = () => {
        moveX(0);
        moveY(0);
        labelX?.(0);
        labelY?.(0);
      };
      magnet.addEventListener("pointermove", onMove);
      magnet.addEventListener("pointerleave", onLeave);
      return () => {
        magnet.removeEventListener("pointermove", onMove);
        magnet.removeEventListener("pointerleave", onLeave);
      };
    });

    // Images and late fonts change heights: re-measure every trigger once settled.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    return () => {
      disposed = true;
      window.removeEventListener("load", refresh);
      root.removeEventListener("click", onClick);
      cleanups.forEach((cleanup) => cleanup());
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
