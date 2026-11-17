import * as THREE from 'three';

const _targetVec = new THREE.Vector3();

/**
 * Second-order damped spring solver for physical motion continuity.
 */
export class SpringDamper {
  constructor(initial = 0, stiffness = 120, damping = 16) {
    this.position = initial;
    this.velocity = 0;
    this.target = initial;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  step(dt, target = this.target) {
    this.target = target;
    const clampedDt = Math.min(0.033, Math.max(0.0005, dt));
    const substeps = clampedDt > 0.017 ? 2 : 1;
    const h = clampedDt / substeps;
    for (let i = 0; i < substeps; i++) {
      const force = -this.stiffness * (this.position - this.target);
      const damp = -this.damping * this.velocity;
      this.velocity += (force + damp) * h;
      this.position += this.velocity * h;
    }
    return this.position;
  }

  snap(value) {
    this.position = value;
    this.target = value;
    this.velocity = 0;
  }
}

/**
 * 6 Background Engine Daemons improving temporal pacing, camera rails,
 * spring kinematics, shader anti-aliasing, resource cleanup, and bus sync.
 */
export class DaemonSupervisor {
  constructor() {
    this.daemons = {
      framePacer: {
        id: 'framePacer',
        name: 'Temporal Frame Pacer',
        desc: 'Lockstep delta smoothing & zero-drop 1080p export clock',
        enabled: true,
        smoothedDt: 1 / 60,
        fps: 60
      },
      cameraStabilizer: {
        id: 'cameraStabilizer',
        name: 'Catmull-Rom Camera Stabilizer',
        desc: 'Spline rail interpolation & exponential cross-shot damping',
        enabled: true,
        blendFactor: 1.0,
        lastShotSwitchTime: 0
      },
      kinematicsSolver: {
        id: 'kinematicsSolver',
        name: 'Spring Kinematics & Gait Solver',
        desc: '2nd-order hip/arm spring rig & harmonic CAD breathing',
        enabled: true
      },
      atmosphereDaemon: {
        id: 'atmosphereDaemon',
        name: 'Anti-Static Shader & Atmosphere',
        desc: 'fwidth() grid filtering, horizon fog & 3-point light lerp',
        enabled: true
      },
      resourceWatchdog: {
        id: 'resourceWatchdog',
        name: 'WebGL Watchdog & GC Guard',
        desc: 'GPU geometry disposal & dynamic 1080p buffer balancing',
        enabled: true,
        disposedCount: 0
      },
      systemBus: {
        id: 'systemBus',
        name: 'Unified System Sync Bus',
        desc: 'Real-time state link across Mario, CAD, Movement, Scene & Video',
        enabled: true,
        syncTicks: 0
      }
    };

    this.listeners = new Set();
    this.camPos = new THREE.Vector3(0, 4.2, 10.5);
    this.camTarget = new THREE.Vector3(0, 2.0, 0);
    this.camVel = new THREE.Vector3();
    this.tgtVel = new THREE.Vector3();
    this.fovSpring = new SpringDamper(45, 90, 18);

    // Build smooth closed spline rails for camera modes
    this.orbitRail = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.8, 8.6),
      new THREE.Vector3(7.4, 4.2, 4.4),
      new THREE.Vector3(7.8, 3.6, -3.8),
      new THREE.Vector3(0, 4.4, -7.8),
      new THREE.Vector3(-7.6, 4.0, -3.5),
      new THREE.Vector3(-7.4, 3.7, 4.6)
    ], true, 'catmullrom', 0.5);

    this.sweepRail = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-8.5, 4.8, 7.2),
      new THREE.Vector3(-3.2, 3.4, 9.2),
      new THREE.Vector3(3.4, 3.5, 9.0),
      new THREE.Vector3(8.6, 5.0, 6.8),
      new THREE.Vector3(4.5, 5.6, 3.2),
      new THREE.Vector3(-4.2, 5.4, 3.4)
    ], true, 'catmullrom', 0.5);
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(eventType, payload) {
    if (!this.daemons.systemBus.enabled) return;
    this.daemons.systemBus.syncTicks++;
    this.listeners.forEach((fn) => fn(eventType, payload));
  }

  toggleDaemon(id, enabled) {
    if (this.daemons[id]) {
      this.daemons[id].enabled = Boolean(enabled);
      this.emit('daemon-toggle', { id, enabled: this.daemons[id].enabled });
    }
  }

  getList() {
    return Object.values(this.daemons);
  }

  /**
   * Daemon 1: Temporal Frame Pacer
   * Smooths real-time frame deltas and locks fixed timestep during video export.
   */
  paceDelta(rawDt, isExporting = false, exportFps = 30) {
    if (isExporting) {
      const fixed = 1 / Math.max(24, exportFps);
      this.daemons.framePacer.smoothedDt = fixed;
      this.daemons.framePacer.fps = exportFps;
      return fixed;
    }

    const safeDt = Math.min(0.05, Math.max(0.001, rawDt));
    if (!this.daemons.framePacer.enabled) {
      this.daemons.framePacer.smoothedDt = safeDt;
      this.daemons.framePacer.fps = Math.round(1 / safeDt);
      return safeDt;
    }

    // Exponential moving average eliminates micro-stutter spikes from GC or UI paints
    this.daemons.framePacer.smoothedDt =
      this.daemons.framePacer.smoothedDt * 0.82 + safeDt * 0.18;
    this.daemons.framePacer.fps = Math.round(1 / Math.max(0.004, this.daemons.framePacer.smoothedDt));
    return this.daemons.framePacer.smoothedDt;
  }

  /**
   * Daemon 2: Catmull-Rom Camera Stabilizer
   * Eliminates modulo wrap snaps (like dolly % 4.5) and hard cuts.
   */
  evaluateCamera(camera, mode, t, dt, lagFactor = 0.65, heroFocusPos = null) {
    let desiredX = 0;
    let desiredY = 3.8;
    let desiredZ = 8.6;
    let lookX = 0;
    let lookY = 2.0;
    let lookZ = 0;
    let desiredFov = 45;

    if (mode === 'orbit') {
      const u = (t * 0.045) % 1;
      this.orbitRail.getPointAt(u, _targetVec);
      desiredX = _targetVec.x;
      desiredY = _targetVec.y;
      desiredZ = _targetVec.z;
    } else if (mode === 'dolly') {
      // Smooth continuous cosine push-pull — NEVER uses % modulo jump!
      const wave = 0.5 - 0.5 * Math.cos(t * 0.55);
      desiredX = Math.sin(t * 0.28) * 1.65;
      desiredY = 2.55 + Math.sin(t * 0.36) * 0.45;
      desiredZ = 11.4 - wave * 4.4;
      lookY = 2.05;
      desiredFov = 43 + wave * 3;
    } else if (mode === 'crane') {
      const rise = 0.5 - 0.5 * Math.cos(t * 0.48);
      desiredX = Math.sin(t * 0.32) * 4.5;
      desiredY = 2.1 + rise * 4.6;
      desiredZ = 9.4 - rise * 1.4;
      lookY = 1.9 + rise * 0.3;
    } else if (mode === 'hero') {
      const hx = heroFocusPos ? heroFocusPos.x : -2.2;
      const hz = heroFocusPos ? heroFocusPos.z : 1.6;
      desiredX = hx - 2.6 + Math.sin(t * 0.42) * 1.5;
      desiredY = 2.35 + Math.sin(t * 0.6) * 0.25;
      desiredZ = hz + 5.2;
      lookX = hx * 0.65;
      lookY = 1.45;
      lookZ = hz * 0.65;
      desiredFov = 42;
    } else if (mode === 'sweep') {
      const u = (t * 0.055) % 1;
      this.sweepRail.getPointAt(u, _targetVec);
      desiredX = _targetVec.x;
      desiredY = _targetVec.y;
      desiredZ = _targetVec.z;
      desiredFov = 47;
    }

    if (!this.daemons.cameraStabilizer.enabled) {
      this.camPos.set(desiredX, desiredY, desiredZ);
      this.camTarget.set(lookX, lookY, lookZ);
      camera.fov = desiredFov;
      camera.updateProjectionMatrix();
      camera.position.copy(this.camPos);
      camera.lookAt(this.camTarget);
      return;
    }

    // Damped cinematic spring tracking
    const lambda = THREE.MathUtils.lerp(7.5, 2.2, Math.min(1, Math.max(0, lagFactor)));
    this.camPos.x = THREE.MathUtils.damp(this.camPos.x, desiredX, lambda, dt);
    this.camPos.y = THREE.MathUtils.damp(this.camPos.y, desiredY, lambda, dt);
    this.camPos.z = THREE.MathUtils.damp(this.camPos.z, desiredZ, lambda, dt);

    this.camTarget.x = THREE.MathUtils.damp(this.camTarget.x, lookX, lambda * 1.25, dt);
    this.camTarget.y = THREE.MathUtils.damp(this.camTarget.y, lookY, lambda * 1.25, dt);
    this.camTarget.z = THREE.MathUtils.damp(this.camTarget.z, lookZ, lambda * 1.25, dt);

    const fov = this.fovSpring.step(dt, desiredFov);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    camera.position.copy(this.camPos);
    camera.lookAt(this.camTarget);
  }

  /**
   * Daemon 5: Safely dispose Three.js subtrees without leaking GPU buffers.
   */
  disposeObject3D(root) {
    if (!root) return;
    let count = 0;
    root.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) {
          obj.geometry.dispose();
          count++;
        }
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m?.dispose?.());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
    this.daemons.resourceWatchdog.disposedCount += count;
  }
}

export const daemonSupervisor = new DaemonSupervisor();
