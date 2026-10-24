"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface StreakSphereSwarmProps {
  wordsCount: number;
  streakDays: number;
  isPracticedToday?: boolean;
  className?: string;
}

// 基準グラデーションパレット（画像右端の白光・橙から左端の深海瑠璃まで）
// Day 1: 純白光 (#ffffff)
// Day 6: 黄金橙・発芽 (#ff9400)
// Day 12: 新緑黄・脈動 (#e0f52e)
// Day 18: 翠緑・定着 (#14e07a)
// Day 24: 天空碧・星雲 (#00b8ff)
// Day 30+: 深海瑠璃・完全体 (#0047ff)
export const STREAK_PALETTE = [
  { day: 1, label: "Day 1 (白光・純真)", colorHex: "#ffffff", threeColor: new THREE.Color(1.0, 1.0, 1.0) },
  { day: 6, label: "Day 6 (黄金橙・発芽)", colorHex: "#ff9400", threeColor: new THREE.Color(1.0, 0.58, 0.0) },
  { day: 12, label: "Day 12 (新緑黄・脈動)", colorHex: "#e0f52e", threeColor: new THREE.Color(0.88, 0.96, 0.18) },
  { day: 18, label: "Day 18 (翠緑・定着)", colorHex: "#14e07a", threeColor: new THREE.Color(0.08, 0.88, 0.48) },
  { day: 24, label: "Day 24 (天空碧・星雲)", colorHex: "#00b8ff", threeColor: new THREE.Color(0.0, 0.72, 1.0) },
  { day: 30, label: "Day 30+ (深海瑠璃・完全体)", colorHex: "#0047ff", threeColor: new THREE.Color(0.0, 0.28, 1.0) },
];

export function getStreakColor(days: number): { r: number; g: number; b: number; hex: string } {
  if (days <= 1) {
    return { r: 1.0, g: 1.0, b: 1.0, hex: "#ffffff" };
  }
  if (days >= 30) {
    const last = STREAK_PALETTE[STREAK_PALETTE.length - 1];
    return { r: last.threeColor.r, g: last.threeColor.g, b: last.threeColor.b, hex: last.colorHex };
  }

  for (let i = 0; i < STREAK_PALETTE.length - 1; i++) {
    const start = STREAK_PALETTE[i];
    const end = STREAK_PALETTE[i + 1];
    if (days >= start.day && days <= end.day) {
      const ratio = (days - start.day) / (end.day - start.day);
      const smoothRatio = ratio * ratio * (3 - 2 * ratio);
      const r = start.threeColor.r + (end.threeColor.r - start.threeColor.r) * smoothRatio;
      const g = start.threeColor.g + (end.threeColor.g - start.threeColor.g) * smoothRatio;
      const b = start.threeColor.b + (end.threeColor.b - start.threeColor.b) * smoothRatio;
      const hexR = Math.round(Math.min(1, Math.max(0, r)) * 255).toString(16).padStart(2, "0");
      const hexG = Math.round(Math.min(1, Math.max(0, g)) * 255).toString(16).padStart(2, "0");
      const hexB = Math.round(Math.min(1, Math.max(0, b)) * 255).toString(16).padStart(2, "0");
      return { r, g, b, hex: `#${hexR}${hexG}${hexB}` };
    }
  }
  return { r: 1.0, g: 1.0, b: 1.0, hex: "#ffffff" };
}

export function getStreakFormName(days: number, words: number): { label: string; sub: string } {
  if (words === 0 && days === 0) {
    return { label: "休眠の種", sub: "Dormant Seed" };
  }
  if (days >= 30) {
    return { label: "深海瑠璃の完全体", sub: "Abyssal Azure Orb" };
  }
  if (days >= 24) {
    return { label: "天空碧の星雲", sub: "Cerulean Nebula" };
  }
  if (days >= 18) {
    return { label: "翠緑の覚醒", sub: "Emerald Resonance" };
  }
  if (days >= 12) {
    return { label: "新緑黄の脈動", sub: "Lime Pulse" };
  }
  if (days >= 6) {
    return { label: "黄金橙の胎動", sub: "Amber Stardust" };
  }
  return { label: "純白の萌芽", sub: "Pure White Seed" };
}

// 境界アルファ0%を保証する柔らかな発光スプライトテクスチャを動的生成
function createSeamlessGlowTexture(size = 256): THREE.CanvasTexture {
  const texCanvas = document.createElement("canvas");
  texCanvas.width = size;
  texCanvas.height = size;
  const ctx = texCanvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(texCanvas);

  const center = size / 2;
  const radius = size / 2 - 2;

  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.12, "rgba(255, 255, 255, 0.9)");
  grad.addColorStop(0.35, "rgba(255, 255, 255, 0.35)");
  grad.addColorStop(0.65, "rgba(255, 255, 255, 0.08)");
  grad.addColorStop(0.92, "rgba(255, 255, 255, 0.005)");
  grad.addColorStop(1.0, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(texCanvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function StreakSphereSwarm({
  wordsCount,
  streakDays,
  isPracticedToday = true,
  className = "",
}: StreakSphereSwarmProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Propsのリアルタイム追従用Ref
  const stateRef = useRef({
    wordsCount,
    streakDays,
    isPracticedToday,
  });

  useEffect(() => {
    stateRef.current = { wordsCount, streakDays, isPracticedToday };
  }, [wordsCount, streakDays, isPracticedToday]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;

    try {
      // 1. Scene & Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        55,
        container.clientWidth / (container.clientHeight || 260),
        0.1,
        1000
      );
      camera.position.z = 180;

      // 2. Renderer
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(container.clientWidth, container.clientHeight || 260);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // 3. Textures
      const particleTexture = createSeamlessGlowTexture(128);
      const coreTexture = createSeamlessGlowTexture(512);

      // 4. Center Core Orbs
      const coreInnerMat = new THREE.SpriteMaterial({
        map: coreTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coreInnerSprite = new THREE.Sprite(coreInnerMat);
      coreInnerSprite.scale.set(22, 22, 1);
      scene.add(coreInnerSprite);

      const coreOuterMat = new THREE.SpriteMaterial({
        map: coreTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coreOuterSprite = new THREE.Sprite(coreOuterMat);
      coreOuterSprite.scale.set(50, 50, 1);
      scene.add(coreOuterSprite);

      const ambientGlowMat = new THREE.SpriteMaterial({
        map: coreTexture,
        color: 0x0055ff,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ambientGlowSprite = new THREE.Sprite(ambientGlowMat);
      ambientGlowSprite.scale.set(130, 130, 1);
      scene.add(ambientGlowSprite);

      // 5. Particles Buffer Geometry (最大20,000粒子をバッファ確保)
      const MAX_PARTICLES = 25000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(MAX_PARTICLES * 3);
      const normalizedDistances = new Float32Array(MAX_PARTICLES);
      const angles = new Float32Array(MAX_PARTICLES);
      const phis = new Float32Array(MAX_PARTICLES);
      const colors = new Float32Array(MAX_PARTICLES * 3);
      const randomSeeds = new Float32Array(MAX_PARTICLES * 2);

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const i3 = i * 3;
        normalizedDistances[i] = Math.pow(Math.random(), 0.65);
        angles[i] = Math.random() * Math.PI * 2;
        phis[i] = (Math.random() - 0.5) * Math.PI * 0.75;

        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 1.0;

        randomSeeds[i * 2] = Math.random() * Math.PI * 2;
        randomSeeds[i * 2 + 1] = 0.04 + Math.random() * 0.12;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const pointsMaterial = new THREE.PointsMaterial({
        size: 1.9,
        map: particleTexture,
        transparent: true,
        opacity: 0.85,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particleSystem = new THREE.Points(geometry, pointsMaterial);
      scene.add(particleSystem);

      // 6. Interactive Mouse / Touch Parallax
      let mouseX = 0;
      let mouseY = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;

      const handlePointerMove = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        targetMouseX = ((clientX - rect.left) / rect.width - 0.5) * 2;
        targetMouseY = -((clientY - rect.top) / rect.height - 0.5) * 2;
      };

      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("touchmove", handlePointerMove, { passive: true });

      // 7. Resize Observer
      const handleResize = () => {
        if (!container || !renderer) return;
        const width = container.clientWidth;
        const height = container.clientHeight || 260;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // 8. Main Meditative Animation Loop
      let clock = 0;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const currentWords = stateRef.current.wordsCount;
        const currentStreakDays = stateRef.current.streakDays;
        const currentPracticed = stateRef.current.isPracticedToday;

        // 描画粒子数（最低200粒子〜最大MAX_PARTICLES）
        const clampedWords = Math.max(0, currentWords);
        const particleCount = clampedWords === 0 && currentStreakDays === 0
          ? 0
          : Math.min(MAX_PARTICLES, Math.max(200, clampedWords));
        geometry.setDrawRange(0, particleCount);

        const speedMultiplier = currentPracticed ? 0.35 : 0.08;
        clock += 0.016 * speedMultiplier;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // ワード数に応じた空間拡散半径
        const wordRatio = Math.min(1.0, particleCount / MAX_PARTICLES);
        const maxSpreadRadius = 14 + Math.pow(wordRatio, 0.42) * 105;

        pointsMaterial.size = currentPracticed ? 1.8 : 1.3;
        pointsMaterial.opacity = currentPracticed ? 0.85 : 0.22;

        const streakColor = getStreakColor(currentStreakDays);

        // 中心コアの脈動
        const pulse = Math.sin(clock * 1.8) * 0.06;
        const baseCoreScale = particleCount === 0 && currentStreakDays === 0
          ? 8
          : 18 + Math.pow(wordRatio, 0.4) * 16;

        coreInnerSprite.scale.set(
          baseCoreScale * (1 + pulse),
          baseCoreScale * (1 + pulse),
          1
        );
        coreOuterSprite.scale.set(
          baseCoreScale * 2.3 * (1 + pulse * 0.5),
          baseCoreScale * 2.3 * (1 + pulse * 0.5),
          1
        );

        if (particleCount === 0 && currentStreakDays === 0) {
          coreInnerMat.color.setHex(0x1e293b);
          coreInnerMat.opacity = currentPracticed ? 0.3 : 0.12;
          coreOuterMat.opacity = 0.0;
          ambientGlowSprite.scale.set(0.001, 0.001, 1);
        } else {
          if (currentPracticed) {
            coreInnerMat.color.setRGB(streakColor.r, streakColor.g, streakColor.b);
            coreInnerMat.opacity = 0.95;

            coreOuterMat.color.setRGB(streakColor.r, streakColor.g, streakColor.b);
            coreOuterMat.opacity = 0.38 + (currentStreakDays / 30) * 0.25;

            ambientGlowMat.color.setRGB(
              streakColor.r * 0.8,
              streakColor.g * 0.8,
              streakColor.b * 1.1
            );
            ambientGlowMat.opacity = 0.2 + (currentStreakDays / 30) * 0.55;
            const haloScale =
              75 + (currentStreakDays / 30) * 65 + Math.sin(clock * 1.2) * 8;
            ambientGlowSprite.scale.set(haloScale, haloScale, 1);
          } else {
            coreInnerMat.color.setHex(0x475569);
            coreInnerMat.opacity = 0.25;
            coreOuterMat.opacity = 0.08;
            ambientGlowMat.opacity = 0.04;
          }
        }

        // 粒子座標とカラーの計算
        const posAttr = geometry.attributes.position;
        const colAttr = geometry.attributes.color;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const phase = randomSeeds[i * 2];
          const orbitSpeed = randomSeeds[i * 2 + 1];
          const normDist = normalizedDistances[i];
          const theta = angles[i];
          const phi = phis[i];

          const currentRadius =
            4 + normDist * maxSpreadRadius + Math.sin(clock * 1.4 + phase) * (3 + normDist * 4);
          const effectiveRadius = currentPracticed
            ? currentRadius
            : currentRadius * 0.88;

          const angle = theta + clock * orbitSpeed * 0.85;

          let px = effectiveRadius * Math.cos(angle) * Math.cos(phi);
          let py = effectiveRadius * Math.sin(angle) * Math.cos(phi);
          let pz =
            effectiveRadius * Math.sin(phi) * 0.45 +
            Math.sin(clock * 1.8 + phase) * 2;

          // マウス重力場のインタラクション
          const dx = px - mouseX * 80;
          const dy = py - mouseY * 80;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            const force = (1 - dist / 60) * 12;
            px += (dx / dist) * force;
            py += (dy / dist) * force;
          }

          positions[i3] = px;
          positions[i3 + 1] = py;
          positions[i3 + 2] = pz;

          if (!currentPracticed) {
            colors[i3] = 0.35;
            colors[i3 + 1] = 0.4;
            colors[i3 + 2] = 0.48;
          } else {
            const shimmer = 0.92 + Math.sin(clock * 2.5 + phase) * 0.08;
            colors[i3] = Math.min(1.0, streakColor.r * shimmer);
            colors[i3 + 1] = Math.min(1.0, streakColor.g * shimmer);
            colors[i3 + 2] = Math.min(1.0, streakColor.b * shimmer);
          }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        camera.position.x += (mouseX * 14 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 14 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        if (renderer) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("touchmove", handlePointerMove);
        resizeObserver.disconnect();
        geometry.dispose();
        pointsMaterial.dispose();
        particleTexture.dispose();
        coreTexture.dispose();
        coreInnerMat.dispose();
        coreOuterMat.dispose();
        ambientGlowMat.dispose();
        if (renderer) {
          renderer.dispose();
        }
      };
    } catch (err) {
      console.warn("Failed to initialize Three.js StreakSphereSwarm:", err);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[220px] sm:h-[260px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#080d1a] to-[#04060a] border border-slate-800/80 shadow-inner flex items-center justify-center ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block outline-none cursor-grab active:cursor-grabbing" />
    </div>
  );
}
