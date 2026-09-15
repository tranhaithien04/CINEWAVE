import * as THREE from "three";

import type { Seat } from "@/@types/seat";
import { isSeatTaken } from "@/utils/seat";

const COLORS = {
  available: 0x334155,
  vip: 0xeab308,
  couple: 0xe11d48,
  selected: 0x10b981,
  taken: 0x1e293b,
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
  material: THREE.MeshStandardMaterial;
  baseY: number;
  seat: Seat;
};

export type CameraMode = "orbit" | "seat";

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

function applyVisual(visual: SeatVisual, selected: boolean, hover: boolean) {
  const taken = isSeatTaken(visual.seat);
  const color = seatBaseColor(visual.seat, selected);
  visual.material.color.setHex(color);
  visual.material.emissive.setHex(selected ? COLORS.selected : color);
  visual.material.emissiveIntensity = taken ? 0.02 : hover ? 0.55 : selected ? 0.42 : 0.12;
  visual.group.position.y = visual.baseY + (hover && !taken ? 0.07 : selected ? 0.04 : 0);
}

function makeLabelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "#d4d4d8";
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
  gradient.addColorStop(0, "#083344");
  gradient.addColorStop(0.45, "#0891b2");
  gradient.addColorStop(1, "#164e63");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 448);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  for (let i = 0; i < 40; i += 1) {
    ctx.fillRect(0, i * 12, 1024, 2);
  }
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "600 78px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MÀN HÌNH", 512, 224);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function columnX(colIndex: number) {
  const spacingX = 0.56;
  const aisle = 0.62;
  const xs = Array.from({ length: 10 }, (_, index) => {
    let shift = 0;
    if (index >= 4) shift += aisle;
    if (index >= 6) shift += aisle;
    return index * spacingX + shift;
  });
  const mid = (xs[0] + xs[9]) / 2;
  return xs[colIndex] - mid;
}

export function seatWorldPosition(rowIndex: number, colIndex: number) {
  return {
    x: columnX(colIndex),
    y: rowIndex * 0.2,
    z: rowIndex * 0.78,
  };
}

function createChair(material: THREE.MeshStandardMaterial, wide = false) {
  const group = new THREE.Group();
  const w = wide ? 0.5 : 0.4;
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, 0.36), material);
  cushion.position.y = 0.14;
  // Tựa ghế ở +Z (phía khán giả) — người ngồi nhìn về màn hình -Z
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, 0.36, 0.07), material);
  back.position.set(0, 0.32, 0.16);
  back.rotation.x = 0.12;
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.32), material);
  leftArm.position.set(-w / 2 + 0.02, 0.2, 0);
  const rightArm = leftArm.clone();
  rightArm.position.x = w / 2 - 0.02;
  group.add(cushion, back, leftArm, rightArm);
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

function seatHallBox(seats: Seat[], rows: string[]) {
  const box = new THREE.Box3();
  for (const seat of seats) {
    const rowIndex = rows.indexOf(seat.row);
    const pos = seatWorldPosition(rowIndex, seat.number - 1);
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

export function createSeatPickerScene(canvas: HTMLCanvasElement, seats: Seat[]): SeatPickerScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06070d);
  scene.fog = new THREE.Fog(0x06070d, 16, 32);

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
  renderer.toneMappingExposure = 1.08;

  scene.add(new THREE.AmbientLight(0x67e8f9, 0.22));

  const screenLight = new THREE.SpotLight(0x67e8f9, 32, 22, Math.PI / 4.6, 0.5, 1.05);
  screenLight.position.set(0, 3.1, -4.2);
  screenLight.target.position.set(0, 0.2, 2);
  scene.add(screenLight, screenLight.target);

  const fill = new THREE.PointLight(0x22d3ee, 7, 16);
  fill.position.set(0, 3.4, -1.4);
  scene.add(fill);

  const screenTex = makeScreenTexture();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 3.5),
    new THREE.MeshStandardMaterial({
      map: screenTex,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.55,
      roughness: 0.28,
      metalness: 0.08,
    }),
  );
  screen.position.copy(SCREEN_POS);
  scene.add(screen);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(8.9, 3.9),
    new THREE.MeshStandardMaterial({ color: 0x120c1c, roughness: 0.85 }),
  );
  frame.position.set(0, 2.15, -3.22);
  scene.add(frame);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 22),
    new THREE.MeshStandardMaterial({ color: 0x0c0914, roughness: 0.96 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.62, 2.4);
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x100818, roughness: 0.9 });
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9.2, 20), wallMat);
  leftWall.position.set(-6.6, 3.6, 2.4);
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

  const rows = [...new Set(seats.map((seat) => seat.row))];
  const visuals = new Map<string, SeatVisual>();

  for (const seat of seats) {
    const rowIndex = rows.indexOf(seat.row);
    const pos = seatWorldPosition(rowIndex, seat.number - 1);
    const material = new THREE.MeshStandardMaterial({
      color: seatBaseColor(seat, false),
      roughness: 0.48,
      metalness: 0.16,
    });
    const group = createChair(material, seat.type === "COUPLE");
    group.position.set(pos.x, pos.y - 0.28, pos.z);
    group.rotation.x = 0.06 + rowIndex * 0.012;
    group.userData.seatId = seat.id;
    group.userData.rowIndex = rowIndex;
    group.traverse((child) => {
      child.userData.seatId = seat.id;
    });
    scene.add(group);
    const visual = { group, material, baseY: group.position.y, seat };
    visuals.set(seat.id, visual);
    applyVisual(visual, false, false);
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const left = seatWorldPosition(rowIndex, 0);
    const right = seatWorldPosition(rowIndex, 9);
    const texture = makeLabelTexture(rows[rowIndex]);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const leftSprite = new THREE.Sprite(spriteMat);
    const rightSprite = new THREE.Sprite(spriteMat);
    leftSprite.scale.set(0.38, 0.38, 1);
    rightSprite.scale.set(0.38, 0.38, 1);
    leftSprite.position.set(left.x - 0.62, left.y + 0.05, left.z);
    rightSprite.position.set(right.x + 0.62, right.y + 0.05, right.z);
    scene.add(leftSprite, rightSprite);
  }

  const framing = computeFraming(seatHallBox(seats, rows), 1.35);

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
    dispose() {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          if ("geometry" in object && object.geometry) object.geometry.dispose();
          const material = object.material;
          const list = Array.isArray(material) ? material : [material];
          for (const item of list) {
            const mapped = item as THREE.MeshStandardMaterial;
            mapped.map?.dispose();
            item.dispose();
          }
        }
      });
      screenTex.dispose();
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
