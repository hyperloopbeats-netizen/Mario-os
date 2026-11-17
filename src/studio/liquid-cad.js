import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CAD_PRESETS, buildAssemblyGroup } from './cad-presets.js';

function detectSoftwareGl() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class LiquidCADApp {
  constructor(canvas) {
    this.canvas = canvas;
    this.isSoftwareGl = detectSoftwareGl();
    this.contextLost = false;
    this.active = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.contextLost = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.contextLost = false;
    });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05080f);
    this.scene.fog = new THREE.FogExp2(0x05080f, 0.024);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 120);
    this.camera.position.set(5.2, 4.2, 6.2);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.target.set(0, 1.8, 0);
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 24;

    // 3-Point Studio Lighting
    this.scene.add(new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 0.65));

    const key = new THREE.DirectionalLight(0xfff5e4, 1.75);
    key.position.set(6, 10, 7);
    key.castShadow = !this.isSoftwareGl;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rim.position.set(-7, 5, -6);
    this.scene.add(rim);

    // CAD Floor + Precision Grid (polygonOffset to prevent Z-fighting)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.42,
      metalness: 0.55
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 48), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.015;
    grid.material.polygonOffset = true;
    grid.material.polygonOffsetFactor = -1;
    grid.material.polygonOffsetUnits = -1;
    this.scene.add(grid);

    this.params = {
      scaleGlobal: 1.0,
      scaleX: 1.0,
      scaleY: 1.0,
      scaleZ: 1.0,
      explode: 0.0,
      detail: 24,
      spinMult: 1.0,
      wireframe: false
    };

    this.currentAssembly = CAD_PRESETS.hyperloop_turbine;
    this.assemblyGroup = null;
    this.rebuildAssembly();

    this.clock = new THREE.Clock();
    this.rafId = 0;
  }

  setAssembly(assembly) {
    this.currentAssembly = assembly;
    this.rebuildAssembly();
  }

  rebuildAssembly() {
    if (this.assemblyGroup) {
      this.scene.remove(this.assemblyGroup);
      this.assemblyGroup.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry.dispose();
          obj.material.dispose();
        }
      });
    }
    this.assemblyGroup = buildAssemblyGroup(this.currentAssembly, {
      detail: this.params.detail,
      wireframe: this.params.wireframe
    });
    this.scene.add(this.assemblyGroup);
  }

  resize(width, height) {
    if (width < 10 || height < 10) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.clock.getDelta();
    this.tick();
  }

  stop() {
    this.active = false;
    cancelAnimationFrame(this.rafId);
  }

  tick = () => {
    if (!this.active) return;
    const dt = Math.min(0.05, this.clock.getDelta());

    if (!this.contextLost && this.assemblyGroup) {
      const targetSX = this.params.scaleGlobal * this.params.scaleX;
      const targetSY = this.params.scaleGlobal * this.params.scaleY;
      const targetSZ = this.params.scaleGlobal * this.params.scaleZ;

      this.assemblyGroup.scale.x = THREE.MathUtils.damp(this.assemblyGroup.scale.x, targetSX, 12, dt);
      this.assemblyGroup.scale.y = THREE.MathUtils.damp(this.assemblyGroup.scale.y, targetSY, 12, dt);
      this.assemblyGroup.scale.z = THREE.MathUtils.damp(this.assemblyGroup.scale.z, targetSZ, 12, dt);

      this.assemblyGroup.children.forEach((mesh) => {
        const { basePos, explodeDir, spinSpeed } = mesh.userData;
        if (basePos && explodeDir) {
          mesh.position.x = basePos.x + explodeDir.x * this.params.explode;
          mesh.position.y = basePos.y + explodeDir.y * this.params.explode;
          mesh.position.z = basePos.z + explodeDir.z * this.params.explode;
        }
        if (spinSpeed) {
          mesh.rotation.y += spinSpeed * this.params.spinMult * dt;
        }
      });

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      window.setTimeout(() => {
        if (this.active) this.rafId = requestAnimationFrame(this.tick);
      }, 65);
    } else {
      this.rafId = requestAnimationFrame(this.tick);
    }
  };
}
