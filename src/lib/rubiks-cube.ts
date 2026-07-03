import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
// @ts-expect-error cubejs 无类型声明
import Cube from "cubejs";

// ============ 颜色配置(专业比赛配色) ============
const COLORS = {
  U: 0xfafafa,
  D: 0xffd400,
  R: 0xee2233,
  L: 0xff7300,
  F: 0x00b04f,
  B: 0x0046ad,
};

// ============ 面定义 ============
const FACES: Record<string, { axis: "x" | "y" | "z"; val: number; sign: number }> = {
  U: { axis: "y", val: 1, sign: -1 },
  D: { axis: "y", val: -1, sign: 1 },
  R: { axis: "x", val: 1, sign: -1 },
  L: { axis: "x", val: -1, sign: 1 },
  F: { axis: "z", val: 1, sign: -1 },
  B: { axis: "z", val: -1, sign: 1 },
};

const FACE_DIRECTIONS: Record<string, THREE.Vector3> = {
  U: new THREE.Vector3(0, 1, 0),
  R: new THREE.Vector3(1, 0, 0),
  F: new THREE.Vector3(0, 0, 1),
  D: new THREE.Vector3(0, -1, 0),
  L: new THREE.Vector3(-1, 0, 0),
  B: new THREE.Vector3(0, 0, -1),
};

// Kociemba 标准 facelet 顺序: U R F D L B
const FACELET_POSITIONS: Record<string, number[][]> = {
  U: [[-1, 1, -1], [0, 1, -1], [1, 1, -1], [-1, 1, 0], [0, 1, 0], [1, 1, 0], [-1, 1, 1], [0, 1, 1], [1, 1, 1]],
  R: [[1, 1, 1], [1, 1, 0], [1, 1, -1], [1, 0, 1], [1, 0, 0], [1, 0, -1], [1, -1, 1], [1, -1, 0], [1, -1, -1]],
  F: [[-1, 1, 1], [0, 1, 1], [1, 1, 1], [-1, 0, 1], [0, 0, 1], [1, 0, 1], [-1, -1, 1], [0, -1, 1], [1, -1, 1]],
  D: [[-1, -1, 1], [0, -1, 1], [1, -1, 1], [-1, -1, 0], [0, -1, 0], [1, -1, 0], [-1, -1, -1], [0, -1, -1], [1, -1, -1]],
  L: [[-1, 1, -1], [-1, 1, 0], [-1, 1, 1], [-1, 0, -1], [-1, 0, 0], [-1, 0, 1], [-1, -1, -1], [-1, -1, 0], [-1, -1, 1]],
  B: [[1, 1, -1], [0, 1, -1], [-1, 1, -1], [1, 0, -1], [0, 0, -1], [-1, 0, -1], [1, -1, -1], [0, -1, -1], [-1, -1, -1]],
};

// ============ 圆角贴纸几何体 ============
function makeStickerGeo(size: number, radius: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  const s = size / 2;
  const r = radius;
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r);
  shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s);
  shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r);
  shape.quadraticCurveTo(-s, -s, -s + r, -s);
  return new THREE.ShapeGeometry(shape);
}

export type ProgressCallback = (current: number, total: number) => void;

export class RubiksCubeEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cubeGroup: THREE.Group;
  private cubies: THREE.Group[] = [];
  private bodyGeo: RoundedBoxGeometry;
  private bodyMat: THREE.MeshPhysicalMaterial;
  private stickerGeo: THREE.ShapeGeometry;
  private animationFrameId: number | null = null;
  private busy = false;
  private solverReady = false;

  // 相机轨道控制
  private cam = { theta: Math.PI * 0.25, phi: Math.PI * 0.35, dist: 9 };
  private dragging = false;
  private prevX = 0;
  private prevY = 0;

  // 回调
  public onBusyChange: ((busy: boolean) => void) | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 环境贴图
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 三点布光
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x333355, 0.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(6, 10, 8);
    this.scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.35);
    fillLight.position.set(-8, 4, -6);
    this.scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -6, 4);
    this.scene.add(rimLight);

    // 共享几何体与材质
    this.bodyGeo = new RoundedBoxGeometry(0.95, 0.95, 0.95, 4, 0.08);
    this.bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x0d0d0d,
      roughness: 0.35,
      metalness: 0.0,
      clearcoat: 0.4,
      clearcoatRoughness: 0.35,
    });
    this.stickerGeo = makeStickerGeo(0.78, 0.08);

    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    this.buildCube();
    this.updateCamera();
    this.setupControls(container);
    this.startRenderLoop();
  }

  // ============ 构建魔方 ============
  private buildCube(): void {
    this.cubies.forEach((c) => this.cubeGroup.remove(c));
    this.cubies = [];

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = this.createCubie(x, y, z);
          this.cubies.push(cubie);
          this.cubeGroup.add(cubie);
        }
      }
    }
  }

  private createCubie(x: number, y: number, z: number): THREE.Group {
    const g = new THREE.Group();
    const body = new THREE.Mesh(this.bodyGeo, this.bodyMat);
    g.add(body);

    const off = 0.481;
    const add = (color: number, pos: THREE.Vector3, rot: THREE.Euler) => {
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.25,
        metalness: 0.0,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(this.stickerGeo, mat);
      m.position.copy(pos);
      m.rotation.copy(rot);
      m.userData.isSticker = true;
      g.add(m);
    };

    if (x === 1) add(COLORS.R, new THREE.Vector3(off, 0, 0), new THREE.Euler(0, Math.PI / 2, 0));
    if (x === -1) add(COLORS.L, new THREE.Vector3(-off, 0, 0), new THREE.Euler(0, -Math.PI / 2, 0));
    if (y === 1) add(COLORS.U, new THREE.Vector3(0, off, 0), new THREE.Euler(-Math.PI / 2, 0, 0));
    if (y === -1) add(COLORS.D, new THREE.Vector3(0, -off, 0), new THREE.Euler(Math.PI / 2, 0, 0));
    if (z === 1) add(COLORS.F, new THREE.Vector3(0, 0, off), new THREE.Euler(0, 0, 0));
    if (z === -1) add(COLORS.B, new THREE.Vector3(0, 0, -off), new THREE.Euler(0, Math.PI, 0));

    g.position.set(x, y, z);
    return g;
  }

  // ============ 面旋转动画 ============
  private rotateFace(face: string, dir: number, duration = 340, double = false): Promise<void> {
    return new Promise((resolve) => {
      const { axis, val, sign } = FACES[face];
      const angle = double ? sign * Math.PI : (sign * dir * Math.PI) / 2;
      const pivot = new THREE.Object3D();
      this.cubeGroup.add(pivot);
      const layer = this.cubies.filter((c) => Math.round(c.position[axis]) === val);
      layer.forEach((c) => pivot.attach(c));

      const t0 = performance.now();
      const step = () => {
        const t = Math.min((performance.now() - t0) / duration, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        pivot.rotation[axis] = angle * e;
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          pivot.rotation[axis] = angle;
          pivot.updateMatrixWorld();
          layer.forEach((c) => {
            this.cubeGroup.attach(c);
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
          });
          this.cubeGroup.remove(pivot);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  // ============ 状态读取 ============
  private getStickerColor(cubie: THREE.Group, direction: THREE.Vector3): number {
    const cubiePos = new THREE.Vector3();
    cubie.getWorldPosition(cubiePos);
    for (const child of cubie.children) {
      if (child.userData.isSticker) {
        const stickerPos = new THREE.Vector3();
        child.getWorldPosition(stickerPos);
        const offset = stickerPos.sub(cubiePos).normalize();
        if (offset.dot(direction) > 0.9) {
          const material = (child as THREE.Mesh).material;
          if (Array.isArray(material)) {
            return (material[0] as THREE.MeshPhysicalMaterial).color.getHex();
          }
          return (material as THREE.MeshPhysicalMaterial).color.getHex();
        }
      }
    }
    return -1;
  }

  private findCubieAt(x: number, y: number, z: number): THREE.Group | undefined {
    return this.cubies.find(
      (c) =>
        Math.round(c.position.x) === x &&
        Math.round(c.position.y) === y &&
        Math.round(c.position.z) === z,
    );
  }

  private readCubeState(): string {
    const colorToFace: Record<number, string> = {};
    const centers: Record<string, number[]> = {
      U: [0, 1, 0],
      R: [1, 0, 0],
      F: [0, 0, 1],
      D: [0, -1, 0],
      L: [-1, 0, 0],
      B: [0, 0, -1],
    };
    for (const [face, [x, y, z]] of Object.entries(centers)) {
      const cubie = this.findCubieAt(x, y, z);
      if (!cubie) continue;
      const color = this.getStickerColor(cubie, FACE_DIRECTIONS[face]);
      colorToFace[color] = face;
    }

    let state = "";
    for (const face of ["U", "R", "F", "D", "L", "B"]) {
      for (const [x, y, z] of FACELET_POSITIONS[face]) {
        const cubie = this.findCubieAt(x, y, z);
        if (!cubie) continue;
        const color = this.getStickerColor(cubie, FACE_DIRECTIONS[face]);
        state += colorToFace[color];
      }
    }
    return state;
  }

  public isSolved(): boolean {
    return this.readCubeState() === "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
  }

  // ============ 移动解析与执行 ============
  private parseMove(move: string): { face: string; dir: number; double: boolean } {
    const face = move[0];
    const dir = move.includes("'") ? -1 : 1;
    const double = move.includes("2");
    return { face, dir, double };
  }

  private async executeMove(move: string, duration: number): Promise<void> {
    const { face, dir, double } = this.parseMove(move);
    if (double) {
      await this.rotateFace(face, 1, duration, true);
    } else {
      await this.rotateFace(face, dir, duration);
    }
  }

  public async executeMoveSequence(moves: string[], duration: number, progress?: ProgressCallback): Promise<void> {
    for (let i = 0; i < moves.length; i++) {
      if (progress) progress(i + 1, moves.length);
      await this.executeMove(moves[i], duration);
    }
  }

  // ============ 求解器 ============
  public initSolver(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        Cube.initSolver();
        this.solverReady = true;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  public isSolverReady(): boolean {
    return this.solverReady;
  }

  public async solve(): Promise<string> {
    const state = this.readCubeState();
    const cube = Cube.fromString(state);
    return cube.solve();
  }

  // ============ 操作 ============
  public async scramble(progress?: ProgressCallback): Promise<string[]> {
    this.setBusy(true);
    const faces = ["U", "D", "R", "L", "F", "B"];
    const suffixes = ["", "'", "2"];
    let last: string | null = null;
    const moves: string[] = [];
    for (let i = 0; i < 25; i++) {
      let f: string;
      do {
        f = faces[Math.floor(Math.random() * 6)];
      } while (f === last);
      last = f;
      const s = suffixes[Math.floor(Math.random() * 3)];
      moves.push(f + s);
    }
    await this.executeMoveSequence(moves, 120, progress);
    this.setBusy(false);
    return moves;
  }

  public async applyMoves(moves: string[], duration: number, progress?: ProgressCallback): Promise<void> {
    this.setBusy(true);
    await this.executeMoveSequence(moves, duration, progress);
    this.setBusy(false);
  }

  public async solveAndAnimate(progress?: ProgressCallback): Promise<string> {
    this.setBusy(true);
    const solution = await this.solve();
    const moves = solution.split(" ").filter((m: string) => m.length > 0);
    if (moves.length > 0) {
      await this.executeMoveSequence(moves, 380, progress);
    }
    this.setBusy(false);
    return solution;
  }

  public reset(): void {
    if (this.busy) return;
    this.buildCube();
  }

  public isBusy(): boolean {
    return this.busy;
  }

  private setBusy(b: boolean): void {
    this.busy = b;
    if (this.onBusyChange) this.onBusyChange(b);
  }

  // ============ 相机控制 ============
  private updateCamera(): void {
    this.camera.position.x = this.cam.dist * Math.sin(this.cam.phi) * Math.cos(this.cam.theta);
    this.camera.position.y = this.cam.dist * Math.cos(this.cam.phi);
    this.camera.position.z = this.cam.dist * Math.sin(this.cam.phi) * Math.sin(this.cam.theta);
    this.camera.lookAt(0, 0, 0);
  }

  private setupControls(container: HTMLElement): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.prevX = e.clientX;
      this.prevY = e.clientY;
    });
    window.addEventListener("pointerup", () => {
      this.dragging = false;
    });
    window.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      this.cam.theta -= (e.clientX - this.prevX) * 0.01;
      this.cam.phi -= (e.clientY - this.prevY) * 0.01;
      this.cam.phi = Math.max(0.2, Math.min(Math.PI - 0.2, this.cam.phi));
      this.prevX = e.clientX;
      this.prevY = e.clientY;
      this.updateCamera();
    });
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.cam.dist += e.deltaY * 0.01;
        this.cam.dist = Math.max(5, Math.min(20, this.cam.dist));
        this.updateCamera();
      },
      { passive: false },
    );

    // 窗口大小变化
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    resizeObserver.observe(container);
  }

  // ============ 渲染循环 ============
  private startRenderLoop(): void {
    const render = () => {
      this.animationFrameId = requestAnimationFrame(render);
      this.renderer.render(this.scene, this.camera);
    };
    render();
  }

  // ============ 销毁 ============
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
    this.bodyGeo.dispose();
    this.bodyMat.dispose();
    this.stickerGeo.dispose();
    const container = this.renderer.domElement.parentElement;
    if (container && this.renderer.domElement.parentNode === container) {
      container.removeChild(this.renderer.domElement);
    }
  }
}