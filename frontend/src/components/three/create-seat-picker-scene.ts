import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import type { Seat } from "@/@types/seat";
import { isSeatTaken } from "@/utils/seat";

const COLORS = {
  available: 0x3f4b63,
  vip: 0xeab308,
  couple: 0xe11d48,
  selected: 0x10b981,
  taken: 0x1e293b,
  frame: 0x1a1524,
} as const;

const SCREEN_POS = new THREE.Vector3(0, 2.15, -3.15);
const OVERVIEW_FOV = 55;
const OVERVIEW_PHI = 1.02;
const FRAME_MARGIN = 0.13;
const CAMERA_Y_MAX = 7.35;
const HALL = {
  xMax: 5.6,
  yMin: 1.15,
  yMax: CAMERA_Y_MAX,
  zMax: 12.4,
};

type OrbitPose = { theta: number; phi: number; radius: number };

type CameraFraming = {
  target: THREE.Vector3;
  seatBox: THREE.Box3;
  overview: OrbitPose;
  topDown: OrbitPose;
  limits: { theta: number; phiMin: number; phiMax: number; radiusMin: number; radiusMax: number };
};

type SeatVisual = {
  group: THREE.Group;
  cushion: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  baseY: number;
  seat: Seat;
};

export type CameraMode = "orbit" | "seat";

export type SeatPickerOptions = {
  posterUrl?: string | null;
};

export type SeatPickerScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  raycaster: THREE.Raycaster;
  visuals: Map<string, SeatVisual>;
  orbit: { theta: number; phi: number; radius: number };
  target: THREE.Vector3;
  look: THREE.Vector3;
  desiredPos: THREE.Vector3;
  desiredLook: THREE.Vector3;
  pointer: THREE.Vector2;
  hoverId: string | null;
  selectedIds: Set<string>;
  mode: CameraMode;
  viewSeatId: string | null;
  framing: CameraFraming;
  screenMat: THREE.MeshStandardMaterial;
  clock: number;
  dispose: () => void;
};

function seatBaseColor(seat: Seat, selected: boolean) {
  if (seat.state === "HELD") return 0xf59e0b;
  if (isSeatTaken(seat)) return COLORS.taken;
  if (selected) return COLORS.selected;
  if (seat.type === "VIP") return COLORS.vip;
  if (seat.type === "COUPLE") return COLORS.couple;
  return COLORS.available;
}

function frameColorFor(seat: Seat, selected: boolean) {
  if (selected) return 0x064e3b;
  if (isSeatTaken(seat) || seat.state === "HELD") return 0x0f172a;
  if (seat.type === "VIP") return 0x422006;
  if (seat.type === "COUPLE") return 0x4c0519;
  return COLORS.frame;
}

function applyVisual(visual: SeatVisual, selected: boolean, hover: boolean) {
  const taken = isSeatTaken(visual.seat);
  const color = seatBaseColor(visual.seat, selected);
  visual.cushion.color.setHex(color);
  visual.cushion.emissive.setHex(selected ? COLORS.selected : color);
  visual.cushion.emissiveIntensity = taken ? 0.02 : hover ? 0.42 : selected ? 0.32 : 0.08;
  visual.frame.color.setHex(frameColorFor(visual.seat, selected));
  visual.frame.emissive.setHex(0x000000);
  visual.frame.emissiveIntensity = 0;
  visual.group.position.y = visual.baseY + (hover && !taken ? 0.07 : selected ? 0.04 : 0);
}

function makeLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 448;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createLinearGradient(0, 0, 1024, 448);
  gradient.addColorStop(0, "#042f2e");
  gradient.addColorStop(0.35, "#0e7490");
  gradient.addColorStop(0.7, "#22d3ee");
  gradient.addColorStop(1, "#083344");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 448);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 56; i += 1) {
    ctx.fillRect(0, i * 8, 1024, 2);
  }
  ctx.fillStyle = "rgba(8,20,30,0.35)";
  ctx.fillRect(0, 0, 1024, 448);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "600 72px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CINEWAVE", 512, 200);
  ctx.font = "500 36px system-ui, sans-serif";
  ctx.fillStyle = "rgba(226,232,240,0.85)";
  ctx.fillText("MÀN HÌNH", 512, 268);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCarpetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#3b1220";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCurtainTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const base = ctx.createLinearGradient(0, 0, 256, 0);
  base.addColorStop(0, "#4c0519");
  base.addColorStop(0.5, "#9f1239");
  base.addColorStop(1, "#4c0519");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 14) {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(x, 0, 5, 512);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x + 5, 0, 2, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeExitTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = "#022c22";
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = "#6ee7b7";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 240, 112);
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXIT", 128, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createExitSign(texture: THREE.CanvasTexture) {
  const group = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.3, 0.04),
    new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x10b981,
      emissiveMap: texture,
      emissiveIntensity: 0.85,
      roughness: 0.4,
      metalness: 0.1,
    }),
  );
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.36, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.35 }),
  );
  housing.position.z = -0.02;
  group.add(housing, plate);
  return group;
}

function createWallSconce() {
  const group = new THREE.Group();
  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.55, metalness: 0.4 }),
  );
  bracket.position.z = -0.02;
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.1, 0.14, 12, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.55,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.set(0, -0.02, 0.06);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 10, 10),
    new THREE.MeshStandardMaterial({
      color: 0xfff7ed,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    }),
  );
  bulb.position.set(0, -0.02, 0.06);
  group.add(bracket, shade, bulb);
  return group;
}

const ROW_DZ = 0.78;
const ROW_DY = 0.2;
const SEAT_SPACING_X = 0.56;
const AISLE_GAP = 0.58;

function aisleBreaks(colCount: number) {
  const count = Math.max(colCount, 1);
  const leftBreak = Math.max(1, Math.floor(count * 0.4) - 1);
  const rightBreak = Math.max(leftBreak + 1, Math.floor(count * 0.6) - 1);
  return { leftBreak, rightBreak };
}

function columnX(colIndex: number, colCount = 10) {
  const count = Math.max(colCount, 1);
  const { leftBreak, rightBreak } = aisleBreaks(count);
  const xs = Array.from({ length: count }, (_, index) => {
    let shift = 0;
    if (index > leftBreak) shift += AISLE_GAP;
    if (index > rightBreak) shift += AISLE_GAP;
    return index * SEAT_SPACING_X + shift;
  });
  const mid = (xs[0] + xs[count - 1]) / 2;
  return xs[Math.min(colIndex, count - 1)] - mid;
}

/** Centers + widths of the two walkways between seat blocks. */
function aisleLanes(colCount: number) {
  const count = Math.max(colCount, 1);
  const { leftBreak, rightBreak } = aisleBreaks(count);
  const halfSeat = 0.24;
  const lanes: { x: number; width: number }[] = [];
  for (const breakAt of [leftBreak, rightBreak]) {
    if (breakAt < 0 || breakAt >= count - 1) continue;
    const leftEdge = columnX(breakAt, count) + halfSeat;
    const rightEdge = columnX(breakAt + 1, count) - halfSeat;
    const width = Math.max(rightEdge - leftEdge, 0.42);
    lanes.push({ x: (leftEdge + rightEdge) / 2, width });
  }
  return lanes;
}

/** Seat-block spans (x center + width) excluding aisle gaps. */
function seatBlockSpans(colCount: number) {
  const count = Math.max(colCount, 1);
  const { leftBreak, rightBreak } = aisleBreaks(count);
  const ranges: [number, number][] = [
    [0, leftBreak],
    [leftBreak + 1, rightBreak],
    [rightBreak + 1, count - 1],
  ];
  const halfSeat = 0.26;
  return ranges
    .filter(([from, to]) => to >= from)
    .map(([from, to]) => {
      const left = columnX(from, count) - halfSeat;
      const right = columnX(to, count) + halfSeat;
      return { x: (left + right) / 2, width: right - left };
    });
}

export function seatWorldPosition(rowIndex: number, colIndex: number, colCount = 10) {
  return {
    x: columnX(colIndex, colCount),
    y: rowIndex * ROW_DY,
    z: rowIndex * ROW_DZ,
  };
}

function createChair(cushion: THREE.MeshStandardMaterial, frame: THREE.MeshStandardMaterial, wide = false) {
  const group = new THREE.Group();
  const w = wide ? 0.52 : 0.42;
  const seatPad = new THREE.Mesh(new RoundedBoxGeometry(w, 0.1, 0.38, 3, 0.04), cushion);
  seatPad.position.y = 0.15;
  seatPad.castShadow = true;
  seatPad.receiveShadow = true;
  const back = new THREE.Mesh(new RoundedBoxGeometry(w, 0.4, 0.08, 3, 0.035), cushion);
  back.position.set(0, 0.36, 0.16);
  back.rotation.x = 0.14;
  back.castShadow = true;
  const leftArm = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.14, 0.34, 2, 0.02), frame);
  leftArm.position.set(-w / 2 + 0.02, 0.22, 0.01);
  leftArm.castShadow = true;
  const rightArm = leftArm.clone();
  rightArm.position.x = w / 2 - 0.02;
  const base = new THREE.Mesh(new RoundedBoxGeometry(w * 0.92, 0.06, 0.34, 2, 0.02), frame);
  base.position.y = 0.06;
  base.receiveShadow = true;
  group.add(seatPad, back, leftArm, rightArm, base);
  return group;
}

function poseFromCamera(target: THREE.Vector3, cameraPos: THREE.Vector3): OrbitPose {
  const offset = cameraPos.clone().sub(target);
  const radius = Math.max(offset.length(), 0.01);
  return {
    theta: Math.atan2(offset.x, offset.z),
    phi: Math.acos(THREE.MathUtils.clamp(offset.y / radius, -1, 1)),
    radius,
  };
}

function screenBounds() {
  return new THREE.Box3(
    new THREE.Vector3(SCREEN_POS.x - 4.2, SCREEN_POS.y - 1.75, SCREEN_POS.z - 0.04),
    new THREE.Vector3(SCREEN_POS.x + 4.2, SCREEN_POS.y + 1.75, SCREEN_POS.z + 0.04),
  );
}

function seatHallBox(seats: Seat[], rows: string[], colCount: number) {
  const box = new THREE.Box3();
  for (const seat of seats) {
    const rowIndex = rows.indexOf(seat.row);
    const pos = seatWorldPosition(rowIndex, seat.number - 1, colCount);
    const half = seat.type === "COUPLE" ? 0.28 : 0.22;
    box.expandByPoint(new THREE.Vector3(pos.x - half - 0.7, pos.y - 0.4, pos.z - 0.22));
    box.expandByPoint(new THREE.Vector3(pos.x + half + 0.7, pos.y + 0.5, pos.z + 0.28));
  }
  return box;
}

function boxCorners(box: THREE.Box3) {
  const { min, max } = box;
  return [
    new THREE.Vector3(min.x, min.y, min.z),
    new THREE.Vector3(min.x, min.y, max.z),
    new THREE.Vector3(min.x, max.y, min.z),
    new THREE.Vector3(min.x, max.y, max.z),
    new THREE.Vector3(max.x, min.y, min.z),
    new THREE.Vector3(max.x, min.y, max.z),
    new THREE.Vector3(max.x, max.y, min.z),
    new THREE.Vector3(max.x, max.y, max.z),
  ];
}

function applyOrbit(orbit: OrbitPose, target: THREE.Vector3, out: THREE.Vector3) {
  out.set(
    target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
    target.y + orbit.radius * Math.cos(orbit.phi),
    target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
  );
}

function cornersFit(camera: THREE.PerspectiveCamera, corners: THREE.Vector3[], margin: number) {
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const mvp = camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse);
  const clip = new THREE.Vector3();
  const limit = 1 - margin;
  for (const corner of corners) {
    clip.copy(corner).applyMatrix4(mvp);
    if (Math.abs(clip.x) > limit || Math.abs(clip.y) > limit || clip.z < -1 || clip.z > 1) return false;
  }
  return true;
}

function keepCameraInHall(target: THREE.Vector3, pose: OrbitPose, out: THREE.Vector3) {
  applyOrbit(pose, target, out);
  if (out.y <= CAMERA_Y_MAX) return;
  const dy = CAMERA_Y_MAX - target.y;
  const horiz = Math.sqrt(Math.max(pose.radius * pose.radius - dy * dy, 0.8));
  out.set(target.x, CAMERA_Y_MAX, target.z + horiz);
  const next = poseFromCamera(target, out);
  pose.theta = next.theta;
  pose.phi = next.phi;
  pose.radius = next.radius;
}

function fitOrbit(target: THREE.Vector3, fitBox: THREE.Box3, phi: number, aspect: number): OrbitPose {
  const camera = new THREE.PerspectiveCamera(OVERVIEW_FOV, Math.max(aspect, 0.9), 0.15, 80);
  const corners = boxCorners(fitBox);
  const pose: OrbitPose = { theta: 0, phi, radius: 6.4 };
  const pos = new THREE.Vector3();
  for (let i = 0; i < 30; i += 1) {
    keepCameraInHall(target, pose, pos);
    camera.position.copy(pos);
    camera.lookAt(target);
    if (cornersFit(camera, corners, FRAME_MARGIN)) break;
    pose.radius += 0.4;
  }
  return pose;
}

function fitTopDown(target: THREE.Vector3, fitBox: THREE.Box3, aspect: number): OrbitPose {
  const camera = new THREE.PerspectiveCamera(OVERVIEW_FOV, Math.max(aspect, 0.9), 0.15, 80);
  const corners = boxCorners(fitBox);
  const pos = new THREE.Vector3(target.x, 6.6, fitBox.max.z + 2.2);
  const pose = poseFromCamera(target, pos);
  for (let i = 0; i < 24; i += 1) {
    pos.y = Math.min(pos.y, CAMERA_Y_MAX);
    pos.z = Math.max(pos.z, fitBox.max.z + 1.9);
    Object.assign(pose, poseFromCamera(target, pos));
    camera.position.copy(pos);
    camera.lookAt(target);
    if (cornersFit(camera, corners, FRAME_MARGIN)) break;
    pos.y += 0.1;
    pos.z += 0.16;
  }
  return pose;
}

function nearPose(a: OrbitPose, b: OrbitPose) {
  return Math.abs(a.phi - b.phi) < 0.05 && Math.abs(a.radius - b.radius) < 0.4 && Math.abs(a.theta - b.theta) < 0.05;
}

function ndcYMid(camera: THREE.PerspectiveCamera, corners: THREE.Vector3[]) {
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const clip = new THREE.Vector3();
  let minY = Infinity;
  let maxY = -Infinity;
  for (const corner of corners) {
    clip.copy(corner).project(camera);
    minY = Math.min(minY, clip.y);
    maxY = Math.max(maxY, clip.y);
  }
  return (minY + maxY) / 2;
}

function balanceTargetY(target: THREE.Vector3, pose: OrbitPose, box: THREE.Box3, aspect: number) {
  const camera = new THREE.PerspectiveCamera(OVERVIEW_FOV, Math.max(aspect, 0.9), 0.15, 80);
  const corners = boxCorners(box);
  const pos = new THREE.Vector3();
  for (let i = 0; i < 10; i += 1) {
    applyOrbit(pose, target, pos);
    pos.y = Math.min(pos.y, CAMERA_Y_MAX);
    camera.position.copy(pos);
    camera.lookAt(target);
    const mid = ndcYMid(camera, corners);
    const desired = -0.08;
    if (Math.abs(mid - desired) < 0.03) break;
    target.y = THREE.MathUtils.clamp(target.y + (mid - desired) * 0.8, 0.55, 2.2);
  }
}

function computeFraming(seatBox: THREE.Box3, aspect: number): CameraFraming {
  const fitBox = seatBox.isEmpty() ? screenBounds() : seatBox.clone().union(screenBounds());
  const seatCenter = (seatBox.isEmpty() ? fitBox : seatBox).getCenter(new THREE.Vector3());
  const fitCenter = fitBox.getCenter(new THREE.Vector3());
  const target = seatCenter.clone();
  target.y = THREE.MathUtils.clamp(THREE.MathUtils.lerp(seatCenter.y, fitCenter.y, 0.62), 1.05, 1.75);
  const overview = fitOrbit(target, fitBox, OVERVIEW_PHI, aspect);
  balanceTargetY(target, overview, fitBox, aspect);
  const topDown = fitTopDown(target, seatBox.isEmpty() ? fitBox : seatBox, aspect);
  return {
    target,
    seatBox: seatBox.clone(),
    overview,
    topDown,
    limits: {
      theta: 0.42,
      phiMin: 0.32,
      phiMax: 1.12,
      radiusMin: Math.min(overview.radius, topDown.radius) * 0.9,
      radiusMax: Math.min(maxRadiusInHall(overview, target), Math.max(overview.radius, topDown.radius) * 1.06),
    },
  };
}

function maxRadiusInHall(orbit: OrbitPose, target: THREE.Vector3) {
  const cosPhi = Math.max(Math.cos(orbit.phi), 0.08);
  const sinPhi = Math.max(Math.sin(orbit.phi), 0.08);
  const byY = (HALL.yMax - target.y) / cosPhi;
  const byZ = (HALL.zMax - target.z) / Math.max(sinPhi * Math.cos(orbit.theta), 0.12);
  const byX = HALL.xMax / Math.max(sinPhi * Math.abs(Math.sin(orbit.theta)), 0.08);
  return Math.min(byY, byZ, byX);
}

function clampOrbit(orbit: SeatPickerScene["orbit"], limits: CameraFraming["limits"], target: THREE.Vector3) {
  orbit.theta = THREE.MathUtils.clamp(orbit.theta, -limits.theta, limits.theta);
  orbit.phi = THREE.MathUtils.clamp(orbit.phi, limits.phiMin, limits.phiMax);
  const hallMax = maxRadiusInHall(orbit, target);
  const maxR = Math.min(limits.radiusMax, hallMax);
  const minR = Math.min(limits.radiusMin, maxR);
  orbit.radius = THREE.MathUtils.clamp(orbit.radius, minR, maxR);
}

function orbitPosition(
  orbit: SeatPickerScene["orbit"],
  target: THREE.Vector3,
  out: THREE.Vector3,
  limits: CameraFraming["limits"],
) {
  clampOrbit(orbit, limits, target);
  out.set(
    target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
    target.y + orbit.radius * Math.cos(orbit.phi),
    target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta),
  );
  out.x = THREE.MathUtils.clamp(out.x, -HALL.xMax, HALL.xMax);
  out.y = THREE.MathUtils.clamp(out.y, HALL.yMin, HALL.yMax);
  out.z = THREE.MathUtils.clamp(out.z, target.z + 1.2, HALL.zMax);
}

export function createSeatPickerScene(
  canvas: HTMLCanvasElement,
  seats: Seat[],
  options: SeatPickerOptions = {},
): SeatPickerScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07060c);
  scene.fog = new THREE.Fog(0x07060c, 14, 30);

  const camera = new THREE.PerspectiveCamera(OVERVIEW_FOV, 1, 0.1, 50);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene.add(new THREE.AmbientLight(0x94a3b8, 0.18));
  scene.add(new THREE.HemisphereLight(0x67e8f9, 0x3b1220, 0.35));

  const screenLight = new THREE.SpotLight(0x67e8f9, 48, 24, Math.PI / 4.4, 0.45, 1.0);
  screenLight.position.set(0, 3.25, -4.0);
  screenLight.target.position.set(0, 0.35, 2.2);
  screenLight.castShadow = true;
  screenLight.shadow.mapSize.set(1024, 1024);
  screenLight.shadow.bias = -0.00015;
  scene.add(screenLight, screenLight.target);

  const fill = new THREE.PointLight(0x22d3ee, 5.5, 14);
  fill.position.set(0, 3.6, -1.1);
  scene.add(fill);

  const warmLeft = new THREE.PointLight(0xfbbf24, 3.2, 9);
  warmLeft.position.set(-2.4, 2.4, 3.2);
  const warmRight = warmLeft.clone();
  warmRight.position.x = 2.4;
  scene.add(warmLeft, warmRight);

  const screenTex = makeScreenTexture();
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: 0x22d3ee,
    emissiveMap: screenTex,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.05,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 3.5), screenMat);
  screen.position.copy(SCREEN_POS);
  scene.add(screen);

  if (options.posterUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(
      options.posterUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const prev = screenMat.map;
        screenMat.map = texture;
        screenMat.emissiveMap = texture;
        screenMat.needsUpdate = true;
        prev?.dispose();
      },
      undefined,
      () => {
        /* keep procedural screen */
      },
    );
  }

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(8.95, 3.95, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1c1428, roughness: 0.7, metalness: 0.25 }),
  );
  frame.position.set(0, 2.15, -3.28);
  frame.castShadow = true;
  scene.add(frame);

  const curtainTex = makeCurtainTexture();
  const curtainMat = new THREE.MeshStandardMaterial({
    map: curtainTex,
    roughness: 0.85,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const leftCurtain = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 4.4), curtainMat);
  leftCurtain.position.set(-5.35, 2.2, -3.05);
  leftCurtain.rotation.y = 0.22;
  const rightCurtain = leftCurtain.clone();
  rightCurtain.position.x = 5.35;
  rightCurtain.rotation.y = -0.22;
  scene.add(leftCurtain, rightCurtain);

  const carpetTex = makeCarpetTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 22),
    new THREE.MeshStandardMaterial({ map: carpetTex, color: 0xffffff, roughness: 0.92, metalness: 0.02 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.62, 2.4);
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x14101c, roughness: 0.88, metalness: 0.04 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.2, 20), wallMat);
  leftWall.position.set(-6.6, 3.6, 2.4);
  leftWall.receiveShadow = true;
  const rightWall = leftWall.clone();
  rightWall.position.x = 6.6;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14, 9.2, 0.2), wallMat);
  backWall.position.set(0, 3.6, -3.4);
  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(14, 9.2, 0.2), wallMat);
  rearWall.position.set(0, 3.6, 13.6);
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 22),
    new THREE.MeshStandardMaterial({ color: 0x0a0712, roughness: 1, side: THREE.DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 8, 2.4);
  scene.add(leftWall, rightWall, backWall, rearWall, ceiling);

  // Acoustic panel strips
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e1530, roughness: 0.95 });
  for (const x of [-6.35, 6.35]) {
    for (let i = 0; i < 5; i += 1) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 2.2), panelMat);
      panel.position.set(x, 2.2 + (i % 2) * 0.15, i * 2.4 - 0.5);
      scene.add(panel);
    }
  }

  // EXIT signs near screen sides + rear doors (low wall height)
  const exitTex = makeExitTexture();
  const exitNearScreen = [
    { x: -4.55, y: 1.65, z: -3.05, ry: 0.15 },
    { x: 4.55, y: 1.65, z: -3.05, ry: -0.15 },
  ];
  const exitRear = [
    { x: -5.9, y: 1.55, z: 11.2, ry: Math.PI / 2 },
    { x: 5.9, y: 1.55, z: 11.2, ry: -Math.PI / 2 },
  ];
  for (const pose of [...exitNearScreen, ...exitRear]) {
    const sign = createExitSign(exitTex);
    sign.position.set(pose.x, pose.y, pose.z);
    sign.rotation.y = pose.ry;
    scene.add(sign);
    const glow = new THREE.PointLight(0x34d399, 0.85, 2.4, 2);
    glow.position.set(pose.x, pose.y, pose.z + (Math.abs(pose.ry) > 1 ? 0 : 0.2));
    if (Math.abs(pose.ry) > 1) {
      glow.position.x += pose.x > 0 ? -0.25 : 0.25;
      glow.position.z = pose.z;
    }
    scene.add(glow);
  }

  // Warm wall sconces along side walls
  const sconceZs = [0.4, 2.8, 5.2, 7.6, 10.0];
  for (const z of sconceZs) {
    for (const side of [-1, 1] as const) {
      const sconce = createWallSconce();
      sconce.position.set(side * 6.42, 2.55, z);
      sconce.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      scene.add(sconce);
      const spill = new THREE.PointLight(0xf59e0b, 1.6, 3.8, 2);
      spill.position.set(side * 5.9, 2.35, z);
      scene.add(spill);
    }
  }

  const rows = [...new Set(seats.map((seat) => seat.row))].sort();
  const colCount = Math.max(10, ...seats.map((seat) => seat.number), 1);
  const visuals = new Map<string, SeatVisual>();

  // Stadium: platforms under seat blocks + real stairs in aisles
  const deckMat = new THREE.MeshStandardMaterial({
    color: 0x2a1018,
    roughness: 0.92,
    metalness: 0.02,
  });
  const stepMat = new THREE.MeshStandardMaterial({
    color: 0x241018,
    roughness: 0.88,
    metalness: 0.04,
  });
  const nosingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1214,
    roughness: 0.55,
    metalness: 0.15,
  });
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.35,
    roughness: 0.35,
    metalness: 0.1,
  });

  const blocks = seatBlockSpans(colCount);
  const lanes = aisleLanes(colCount);
  const treadDepth = ROW_DZ;
  const stepRise = ROW_DY;
  const deckThickness = 0.1;
  const floorY0 = -0.48;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const z = rowIndex * ROW_DZ;
    const topY = floorY0 + rowIndex * ROW_DY;
    const deckCenterY = topY - deckThickness / 2;

    // Platforms only under seat blocks (not across aisles)
    for (const block of blocks) {
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(block.width, deckThickness, treadDepth * 0.96),
        deckMat,
      );
      deck.position.set(block.x, deckCenterY, z);
      deck.receiveShadow = true;
      deck.castShadow = true;
      scene.add(deck);
    }

    // Continuous stairs in each aisle lane
    for (const lane of lanes) {
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(lane.width * 0.92, deckThickness, treadDepth * 0.96),
        stepMat,
      );
      tread.position.set(lane.x, deckCenterY, z);
      tread.receiveShadow = true;
      tread.castShadow = true;
      scene.add(tread);

      // Vertical riser connecting to the row in front (lower)
      if (rowIndex > 0) {
        const riser = new THREE.Mesh(
          new THREE.BoxGeometry(lane.width * 0.92, stepRise, 0.045),
          stepMat,
        );
        riser.position.set(lane.x, topY - stepRise / 2, z - treadDepth / 2 + 0.02);
        riser.castShadow = true;
        riser.receiveShadow = true;
        scene.add(riser);
      }

      // Dark nosing + thin LED on the front edge of each step
      const nosing = new THREE.Mesh(
        new THREE.BoxGeometry(lane.width * 0.88, 0.025, 0.04),
        nosingMat,
      );
      nosing.position.set(lane.x, topY + 0.01, z - treadDepth / 2 + 0.04);
      scene.add(nosing);

      const led = new THREE.Mesh(
        new THREE.BoxGeometry(lane.width * 0.78, 0.012, 0.018),
        ledMat,
      );
      led.position.set(lane.x, topY + 0.018, z - treadDepth / 2 + 0.05);
      scene.add(led);
    }
  }

  // Soft warm spill along aisles (not flat glowing slabs)
  for (const lane of lanes) {
    const midRow = (rows.length - 1) * 0.5;
    const spill = new THREE.PointLight(0xf59e0b, 1.1, 4.5, 2);
    spill.position.set(lane.x, floorY0 + midRow * ROW_DY + 0.15, midRow * ROW_DZ);
    scene.add(spill);
  }

  for (const seat of seats) {
    const rowIndex = rows.indexOf(seat.row);
    const pos = seatWorldPosition(rowIndex, seat.number - 1, colCount);
    const cushion = new THREE.MeshStandardMaterial({
      color: seatBaseColor(seat, false),
      roughness: 0.62,
      metalness: 0.06,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: frameColorFor(seat, false),
      roughness: 0.45,
      metalness: 0.22,
    });
    const group = createChair(cushion, frameMat, seat.type === "COUPLE");
    group.position.set(pos.x, pos.y - 0.28, pos.z);
    group.rotation.x = 0.06 + rowIndex * 0.012;
    group.userData.seatId = seat.id;
    group.userData.rowIndex = rowIndex;
    group.traverse((child) => {
      child.userData.seatId = seat.id;
    });
    scene.add(group);
    const visual = { group, cushion, frame: frameMat, baseY: group.position.y, seat };
    visuals.set(seat.id, visual);
    applyVisual(visual, false, false);
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const rowSeats = seats.filter((seat) => seat.row === rows[rowIndex]);
    const minCol = Math.min(...rowSeats.map((seat) => seat.number));
    const maxCol = Math.max(...rowSeats.map((seat) => seat.number));
    const left = seatWorldPosition(rowIndex, minCol - 1, colCount);
    const right = seatWorldPosition(rowIndex, maxCol - 1, colCount);
    const texture = makeLabelTexture(rows[rowIndex]);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const leftSprite = new THREE.Sprite(spriteMat);
    const rightSprite = new THREE.Sprite(spriteMat.clone());
    leftSprite.scale.set(0.4, 0.4, 1);
    rightSprite.scale.set(0.4, 0.4, 1);
    leftSprite.position.set(left.x - 0.7, left.y + 0.12, left.z);
    rightSprite.position.set(right.x + 0.7, right.y + 0.12, right.z);
    scene.add(leftSprite, rightSprite);
  }

  const framing = computeFraming(seatHallBox(seats, rows, colCount), 1.35);

  const target = framing.target.clone();
  const orbit = { ...framing.overview };
  const desiredPos = new THREE.Vector3();
  orbitPosition(orbit, target, desiredPos, framing.limits);
  camera.position.copy(desiredPos);
  camera.lookAt(target);

  return {
    renderer,
    scene,
    camera,
    raycaster: new THREE.Raycaster(),
    visuals,
    orbit,
    target,
    look: target.clone(),
    desiredPos,
    desiredLook: target.clone(),
    pointer: new THREE.Vector2(),
    hoverId: null,
    selectedIds: new Set(),
    mode: "orbit",
    viewSeatId: null,
    framing,
    screenMat,
    clock: 0,
    dispose() {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          if ("geometry" in object && object.geometry) object.geometry.dispose();
          const material = object.material;
          const list = Array.isArray(material) ? material : [material];
          for (const item of list) {
            const mapped = item as THREE.MeshStandardMaterial;
            mapped.map?.dispose();
            mapped.emissiveMap?.dispose();
            item.dispose();
          }
        }
      });
      renderer.dispose();
    },
  };
}

function snapOrbit(picker: SeatPickerScene) {
  orbitPosition(picker.orbit, picker.target, picker.desiredPos, picker.framing.limits);
  picker.desiredLook.copy(picker.target);
  picker.camera.position.copy(picker.desiredPos);
  picker.look.copy(picker.target);
  picker.camera.fov = OVERVIEW_FOV;
  picker.camera.updateProjectionMatrix();
  picker.camera.lookAt(picker.look);
}

export function resetOverview(picker: SeatPickerScene) {
  picker.mode = "orbit";
  picker.viewSeatId = null;
  picker.orbit.theta = picker.framing.overview.theta;
  picker.orbit.phi = picker.framing.overview.phi;
  picker.orbit.radius = picker.framing.overview.radius;
  picker.target.copy(picker.framing.target);
  snapOrbit(picker);
}

export function setTopDownView(picker: SeatPickerScene) {
  picker.mode = "orbit";
  picker.viewSeatId = null;
  picker.orbit.theta = picker.framing.topDown.theta;
  picker.orbit.phi = picker.framing.topDown.phi;
  picker.orbit.radius = picker.framing.topDown.radius;
  picker.target.copy(picker.framing.target);
  snapOrbit(picker);
}

export function viewFromSeat(picker: SeatPickerScene, seatId: string) {
  if (!picker.visuals.has(seatId)) return false;
  picker.mode = "seat";
  picker.viewSeatId = seatId;
  return true;
}

export function resizeSeatPicker(picker: SeatPickerScene, width: number, height: number) {
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  picker.camera.aspect = w / h;
  picker.camera.updateProjectionMatrix();
  picker.renderer.setSize(w, h, false);

  const next = computeFraming(picker.framing.seatBox, w / h);
  const followOverview = nearPose(picker.orbit, picker.framing.overview);
  const followTop = nearPose(picker.orbit, picker.framing.topDown);
  picker.framing = next;
  picker.target.copy(next.target);
  if (picker.mode !== "orbit") return;
  if (followOverview) {
    Object.assign(picker.orbit, next.overview);
    snapOrbit(picker);
  } else if (followTop) {
    Object.assign(picker.orbit, next.topDown);
    snapOrbit(picker);
  } else {
    clampOrbit(picker.orbit, next.limits, picker.target);
  }
}

function paint(picker: SeatPickerScene) {
  for (const [id, visual] of picker.visuals) {
    applyVisual(visual, picker.selectedIds.has(id), picker.hoverId === id);
  }
}

export function setSelectedSeats(picker: SeatPickerScene, selectedIds: string[]) {
  picker.selectedIds = new Set(selectedIds);
  paint(picker);
}

/** Refresh seat availability/type without recreating the WebGL scene (keeps camera mode). */
export function updateSeatStates(picker: SeatPickerScene, seats: Seat[]) {
  for (const seat of seats) {
    const visual = picker.visuals.get(seat.id);
    if (visual) visual.seat = seat;
  }
  paint(picker);
}

export function pickSeatId(picker: SeatPickerScene, clientX: number, clientY: number) {
  const rect = picker.renderer.domElement.getBoundingClientRect();
  picker.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  picker.raycaster.setFromCamera(picker.pointer, picker.camera);
  const meshes = [...picker.visuals.values()].map((visual) => visual.group);
  const hit = picker.raycaster.intersectObjects(meshes, true)[0];
  const seatId = hit?.object.userData.seatId as string | undefined;
  return seatId ?? null;
}

export function hoverSeat(picker: SeatPickerScene, seatId: string | null) {
  if (picker.hoverId === seatId) return;
  picker.hoverId = seatId;
  paint(picker);
}

export function zoomSeatPicker(picker: SeatPickerScene, deltaY: number) {
  if (picker.mode !== "orbit") return;
  picker.orbit.radius += THREE.MathUtils.clamp(deltaY * 0.004, -0.45, 0.45);
  clampOrbit(picker.orbit, picker.framing.limits, picker.target);
}

export function tickSeatPicker(picker: SeatPickerScene) {
  picker.clock += 1 / 60;
  if (picker.screenMat) {
    picker.screenMat.emissiveIntensity = 0.48 + Math.sin(picker.clock * 1.65) * 0.07 + Math.sin(picker.clock * 4.2) * 0.02;
  }

  if (picker.mode === "seat" && picker.viewSeatId) {
    const visual = picker.visuals.get(picker.viewSeatId);
    if (visual) {
      picker.desiredPos.set(visual.group.position.x, visual.group.position.y + 0.52, visual.group.position.z + 0.28);
      picker.desiredLook.copy(SCREEN_POS);
      if (picker.camera.fov !== 58) {
        picker.camera.fov = 58;
        picker.camera.updateProjectionMatrix();
      }
    }
  } else {
    orbitPosition(picker.orbit, picker.target, picker.desiredPos, picker.framing.limits);
    picker.desiredLook.copy(picker.target);
  }

  picker.camera.position.lerp(picker.desiredPos, 0.14);
  picker.look.lerp(picker.desiredLook, 0.14);
  picker.camera.lookAt(picker.look);
  picker.renderer.render(picker.scene, picker.camera);
}
