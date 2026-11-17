import { initLiquidBackdrop } from './os/liquid-backdrop.js';
import { WindowManager } from './os/window-manager.js';
import { MarioAudio } from './mario/audio.js';
import { MarioEngine } from './mario/engine.js';
import { MarioRenderer2D } from './mario/renderer-2d.js';
import { MarioRenderer3D } from './mario/renderer-3d.js';
import { CAD_PRESETS, MOVIE_PRESETS } from './studio/cad-presets.js';
import { daemonSupervisor } from './studio/daemons.js';
import { hybridMovement, HybridMovementApp } from './studio/hybrid-movement.js';
import { hybridScene, HybridSceneApp } from './studio/hybrid-scene.js';
import { LiquidCADApp } from './studio/liquid-cad.js';
import { ProductionMatrixEngine } from './studio/production-matrix.js';
import { BlackGlassVideoApp } from './studio/black-glass-video.js';
import { TEXT2MOVIE_RECIPES, TextToMovieApp } from './studio/text-to-movie.js';

const REPO_MODULES = [
  { id: 'AIM OSx Sentient Game Generaror', title: 'AIM OS Nexus v5.0', desc: 'Sentient Game Generator OS' },
  { id: 'AIM OS V8.4', title: 'AIM OS v8.5', desc: 'Cognitive Suite & NetSphere Browser' },
  { id: 'AIM OS Brain', title: 'AIM OS Brain v1.0', desc: 'Unified App Brain & Modular Suite' },
  { id: 'PS6 Sun', title: 'Cometic Engine v26.3', desc: 'Cute Data Visual Matrix' },
  { id: 'Sun2', title: 'Sentient Sun OS', desc: 'Sovereign Desktop & Fractal Core' },
  { id: 'The Sun', title: 'Digital Sun Core', desc: 'Sovereign Mobile Fractal Core' },
  { id: 'AutoCAD', title: 'AiM CAD Kernel', desc: 'Self-Hosting CAD & DSL Workstation' },
  { id: 'Face2', title: 'Ballistic Studio v12', desc: '3D Ballistic & Fluid Viewport' },
  { id: 'AIM Cometic OS V30', title: 'AIM Cometic OS V30', desc: 'Kernel Architecture Spec (JSON)' }
];

// 1. Initialize Black Liquid Ferrofluid Backdrop
const backdropCanvas = document.getElementById('liquid-backdrop');
initLiquidBackdrop(backdropCanvas);

// 2. Initialize Mario Audio, Game Engine & 2D/3D Renderers
const audio = new MarioAudio();
const engine = new MarioEngine(audio);

const canvas2D = document.getElementById('mario-2d-canvas');
const canvas3D = document.getElementById('mario-3d-canvas');
const renderer2D = new MarioRenderer2D(canvas2D);
const renderer3D = new MarioRenderer3D(canvas3D);
let renderMode = '2d';

// 3. Initialize Studio Engines (Liquid CAD, Movement, Scene Designer, Matrix, Video, Text2Movie)
const cadCanvas = document.getElementById('cad-canvas');
const cadApp = new LiquidCADApp(cadCanvas);

const movementCanvas = document.getElementById('movement-canvas');
const movementApp = new HybridMovementApp(movementCanvas);

const sceneCanvas = document.getElementById('scene-canvas');
const sceneApp = new HybridSceneApp(sceneCanvas);

const matrixPreviewCanvas = document.getElementById('matrix-canvas');
const videoCompositorCanvas = document.getElementById('video-compositor-canvas');
const t2mPreviewCanvas = document.getElementById('t2m-canvas');

const matrixEngine = new ProductionMatrixEngine();
const videoApp = new BlackGlassVideoApp(videoCompositorCanvas, matrixEngine);
const t2mApp = new TextToMovieApp(t2mPreviewCanvas, videoApp, matrixEngine, cadApp);

// 4. Initialize Window Manager
const wm = new WindowManager();
wm.register('win-mario', 'Super Mario');
wm.register('win-cad', 'Liquid CAD');
wm.register('win-movement', 'Movement');
wm.register('win-scene', 'Scene');
wm.register('win-matrix', 'Matrix');
wm.register('win-text2movie', 'Text to Movie');
wm.register('win-video', 'Video Studio');
wm.register('win-controls', 'Physics');
wm.register('win-audio', 'Audio');
wm.register('win-suite', 'AIM Suite');

function isWindowVisible(id) {
  const el = document.getElementById(id);
  return el && !el.classList.contains('is-hidden') && !el.classList.contains('is-minimized');
}

const cadViewportEl = document.getElementById('cad-viewport');
const movementViewportEl = document.getElementById('movement-viewport');
const sceneViewportEl = document.getElementById('scene-viewport');

function resizeStudioViewport(el, app) {
  const rect = el.getBoundingClientRect();
  if (rect.width > 20 && rect.height > 20) {
    app.resize(Math.floor(rect.width), Math.floor(rect.height));
  }
}

function syncStudioLoops() {
  if (isWindowVisible('win-cad')) {
    resizeStudioViewport(cadViewportEl, cadApp);
    cadApp.start();
  } else {
    cadApp.stop();
  }

  if (isWindowVisible('win-movement')) {
    resizeStudioViewport(movementViewportEl, movementApp);
    movementApp.start();
  } else {
    movementApp.stop();
  }

  if (isWindowVisible('win-scene')) {
    resizeStudioViewport(sceneViewportEl, sceneApp);
    sceneApp.start();
  } else {
    sceneApp.stop();
  }
}

wm.onLayoutChange = (id) => {
  if (id === 'win-mario') resizeViewports();
  if (id === 'win-cad') resizeStudioViewport(cadViewportEl, cadApp);
  if (id === 'win-movement') resizeStudioViewport(movementViewportEl, movementApp);
  if (id === 'win-scene') resizeStudioViewport(sceneViewportEl, sceneApp);
  syncStudioLoops();
};
wm.focus('win-mario');

// Nav & Dock wiring
document.querySelectorAll('[data-open-window]').forEach((btn) => {
  btn.addEventListener('click', () => {
    wm.open(btn.dataset.openWindow);
    syncStudioLoops();
  });
});
document.querySelectorAll('[data-dock-target]').forEach((btn) => {
  btn.addEventListener('click', () => {
    wm.toggleDock(btn.dataset.dockTarget);
    syncStudioLoops();
  });
});

document.getElementById('btn-os-fullscreen').addEventListener('click', () => {
  const active = ['win-text2movie', 'win-video', 'win-matrix', 'win-scene', 'win-movement', 'win-cad', 'win-mario']
    .find((id) => isWindowVisible(id)) || 'win-mario';
  wm.open(active);
  wm.toggleMaximize(active);
  syncStudioLoops();
});

// 5. Populate AIM GitHub Framework Suite Grid
const suiteGrid = document.getElementById('suite-grid');
REPO_MODULES.forEach((mod) => {
  const link = document.createElement('a');
  link.href = '/' + encodeURIComponent(mod.id);
  link.className = 'suite-card';
  link.innerHTML = `<span class="suite-title">${mod.title}</span><span class="suite-desc">${mod.desc}</span>`;
  suiteGrid.appendChild(link);
});

// 6. Mario Viewport Resizing & Mode Switching
const viewportEl = document.getElementById('mario-viewport');
function resizeViewports() {
  const rect = viewportEl.getBoundingClientRect();
  const w = Math.max(320, Math.floor(rect.width));
  const h = Math.max(200, Math.floor(rect.height));
  renderer2D.resize(w, h);
  renderer3D.resize(w, h);
}
new ResizeObserver(() => resizeViewports()).observe(viewportEl);
new ResizeObserver(() => resizeStudioViewport(cadViewportEl, cadApp)).observe(cadViewportEl);
new ResizeObserver(() => resizeStudioViewport(movementViewportEl, movementApp)).observe(movementViewportEl);
new ResizeObserver(() => resizeStudioViewport(sceneViewportEl, sceneApp)).observe(sceneViewportEl);
resizeViewports();

const btnMode2D = document.getElementById('btn-mode-2d');
const btnMode3D = document.getElementById('btn-mode-3d');
const cameraWrap = document.getElementById('camera-3d-wrap');
const selectCam3D = document.getElementById('select-camera-3d');

function setRenderMode(mode) {
  renderMode = mode;
  canvas2D.classList.toggle('is-hidden', mode !== '2d');
  canvas3D.classList.toggle('is-hidden', mode !== '3d');
  btnMode2D.classList.toggle('is-active', mode === '2d');
  btnMode3D.classList.toggle('is-active', mode === '3d');
  cameraWrap.classList.toggle('is-hidden', mode !== '3d');
  resizeViewports();
}
btnMode2D.addEventListener('click', () => setRenderMode('2d'));
btnMode3D.addEventListener('click', () => setRenderMode('3d'));
selectCam3D.addEventListener('change', () => renderer3D.setCameraMode(selectCam3D.value));
setRenderMode('2d');

// World Selection, Pause, Restart, Touch Pad
const selectWorld = document.getElementById('select-world');
selectWorld.addEventListener('change', () => {
  engine.selectWorld(Number(selectWorld.value));
  syncOverlays();
});
document.getElementById('btn-pause').addEventListener('click', () => {
  engine.togglePause();
  syncOverlays();
});
document.getElementById('btn-restart').addEventListener('click', () => {
  engine.startNewGame(engine.worldIndex);
  syncOverlays();
});

const touchControlsEl = document.getElementById('touch-controls');
const btnTouchToggle = document.getElementById('btn-touch-toggle');
let touchVisible = false;
btnTouchToggle.addEventListener('click', () => {
  touchVisible = !touchVisible;
  touchControlsEl.classList.toggle('is-hidden', !touchVisible);
  btnTouchToggle.classList.toggle('is-active', touchVisible);
});

const overlayTitle = document.getElementById('overlay-title');
const overlayPaused = document.getElementById('overlay-paused');
const overlayEnd = document.getElementById('overlay-end');
const endHeading = document.getElementById('end-heading');
const endSummary = document.getElementById('end-summary');

document.getElementById('btn-start-2d').addEventListener('click', () => {
  setRenderMode('2d');
  engine.startNewGame(Number(selectWorld.value));
  syncOverlays();
});
document.getElementById('btn-start-3d').addEventListener('click', () => {
  setRenderMode('3d');
  engine.startNewGame(Number(selectWorld.value));
  syncOverlays();
});
document.getElementById('btn-resume').addEventListener('click', () => {
  engine.togglePause();
  syncOverlays();
});
document.getElementById('btn-play-again').addEventListener('click', () => {
  engine.startNewGame(0);
  selectWorld.value = '0';
  syncOverlays();
});

function syncOverlays() {
  overlayTitle.classList.toggle('is-hidden', engine.state !== 'TITLE_MENU');
  overlayPaused.classList.toggle('is-hidden', engine.state !== 'PAUSED');
  const isEnd = engine.state === 'GAME_OVER' || engine.state === 'VICTORY';
  overlayEnd.classList.toggle('is-hidden', !isEnd);
  if (isEnd) {
    endHeading.textContent = engine.state === 'VICTORY' ? 'Kingdom Restored' : 'Game Over';
    endSummary.textContent = `Final Score ${String(engine.score).padStart(6, '0')} · Coins ${engine.coins} · Best ${String(engine.highScore).padStart(6, '0')}`;
  }
  selectWorld.value = String(engine.worldIndex);
}

// 7. Keyboard & Touch Controls
const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', KeyK: 'jump',
  ShiftLeft: 'sprint', ShiftRight: 'sprint', KeyX: 'sprint', KeyJ: 'sprint'
};

window.addEventListener('keydown', (e) => {
  if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  if (!isWindowVisible('win-mario')) return;

  if (e.code === 'KeyV') {
    setRenderMode(renderMode === '2d' ? '3d' : '2d');
    return;
  }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (engine.state === 'PLAYING' || engine.state === 'PAUSED') {
      engine.togglePause();
      syncOverlays();
    }
    return;
  }
  if (e.code === 'KeyR' && engine.state !== 'TITLE_MENU') {
    engine.startNewGame(engine.worldIndex);
    syncOverlays();
    return;
  }
  const action = KEY_MAP[e.code];
  if (action) {
    e.preventDefault();
    engine.setKey(action, true);
  }
});

window.addEventListener('keyup', (e) => {
  const action = KEY_MAP[e.code];
  if (action) engine.setKey(action, false);
});

document.querySelectorAll('[data-touch-action]').forEach((btn) => {
  const action = btn.dataset.touchAction;
  const press = (e) => { e.preventDefault(); engine.setKey(action, true); btn.classList.add('is-pressed'); };
  const release = (e) => { e.preventDefault(); engine.setKey(action, false); btn.classList.remove('is-pressed'); };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointerleave', release);
  btn.addEventListener('pointercancel', release);
});

// 8. Liquid CAD App Wiring
const cadSelect = document.getElementById('cad-preset-select');
const cadPrompt = document.getElementById('cad-prompt-input');
const cadBtnSynth = document.getElementById('cad-btn-synth');
const cadStatus = document.getElementById('cad-status');
const cadPartCount = document.getElementById('cad-part-count');

function updateCadMeta() {
  const asm = cadApp.currentAssembly;
  cadStatus.textContent = `${asm.name} — ${asm.summary}`;
  cadStatus.classList.remove('is-error');
  cadPartCount.textContent = `${asm.parts?.length || 0} parts`;
}
updateCadMeta();

cadSelect.addEventListener('change', () => {
  const preset = CAD_PRESETS[cadSelect.value];
  if (preset) {
    cadApp.setAssembly(preset);
    matrixEngine.setCadAssembly(preset);
    updateCadMeta();
  }
});

cadBtnSynth.addEventListener('click', async () => {
  const prompt = cadPrompt.value.trim();
  if (!prompt) {
    cadStatus.textContent = 'Enter a 3D system description first.';
    cadStatus.classList.add('is-error');
    return;
  }
  cadBtnSynth.disabled = true;
  cadBtnSynth.textContent = 'Synthesizing...';
  cadStatus.classList.remove('is-error');
  cadStatus.textContent = 'Generating parametric 3D assembly via Gemini...';
  try {
    const res = await fetch('/api/gemini/cad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Synthesis failed');
    cadApp.setAssembly(data.assembly);
    matrixEngine.setCadAssembly(data.assembly);
    updateCadMeta();
  } catch (err) {
    cadStatus.textContent = err.message;
    cadStatus.classList.add('is-error');
  } finally {
    cadBtnSynth.disabled = false;
    cadBtnSynth.textContent = 'Prompt AI';
  }
});

function bindCadSlider(id, valId, paramKey, suffix = 'x', rebuild = false) {
  const slider = document.getElementById(id);
  const label = document.getElementById(valId);
  slider.addEventListener('input', () => {
    const v = Number(slider.value);
    cadApp.params[paramKey] = v;
    label.textContent = `${v.toFixed(paramKey === 'detail' ? 0 : 2)}${suffix}`;
    if (paramKey === 'scaleGlobal') matrixEngine.cadScale = v;
    if (rebuild) cadApp.rebuildAssembly();
  });
}
bindCadSlider('cad-scale-global', 'val-cad-global', 'scaleGlobal', 'x');
bindCadSlider('cad-scale-x', 'val-cad-x', 'scaleX', 'x');
bindCadSlider('cad-scale-y', 'val-cad-y', 'scaleY', 'x');
bindCadSlider('cad-scale-z', 'val-cad-z', 'scaleZ', 'x');
bindCadSlider('cad-explode', 'val-cad-explode', 'explode', 'u');
bindCadSlider('cad-spin', 'val-cad-spin', 'spinMult', 'x');
bindCadSlider('cad-detail', 'val-cad-detail', 'detail', ' seg', true);

const cadBtnWire = document.getElementById('cad-btn-wire');
cadBtnWire.addEventListener('click', () => {
  cadApp.params.wireframe = !cadApp.params.wireframe;
  cadBtnWire.classList.toggle('is-active', cadApp.params.wireframe);
  cadApp.rebuildAssembly();
});

document.getElementById('cad-btn-send-matrix').addEventListener('click', () => {
  matrixEngine.setCadAssembly(cadApp.currentAssembly);
  matrixEngine.cadScale = cadApp.params.scaleGlobal;
  wm.open('win-matrix');
  syncStudioLoops();
});

// 9. Hybrid Movement App Wiring (Linked to Matrix, Video, Text2Movie)
const mvModeSelect = document.getElementById('mv-mode-select');
const mvEaseSelect = document.getElementById('mv-ease-select');

mvModeSelect.addEventListener('change', () => {
  hybridMovement.applyConfig({ mode: mvModeSelect.value });
  movementApp.rebuildTrajectoryVisual();
});
mvEaseSelect.addEventListener('change', () => {
  hybridMovement.applyConfig({ easeCurve: mvEaseSelect.value });
  movementApp.rebuildTrajectoryVisual();
});

function bindMvSlider(id, valId, key, suffix = '', decimals = 0, rebuildSpline = false) {
  const el = document.getElementById(id);
  const valEl = document.getElementById(valId);
  el.addEventListener('input', () => {
    const v = Number(el.value);
    valEl.textContent = `${v.toFixed(decimals)}${suffix}`;
    hybridMovement.applyConfig({ [key]: v });
    if (rebuildSpline) movementApp.rebuildTrajectoryVisual();
  });
}
bindMvSlider('mv-stiffness', 'val-mv-stiff', 'stiffness', '', 0);
bindMvSlider('mv-damping', 'val-mv-damp', 'damping', '', 0);
bindMvSlider('mv-speed', 'val-mv-speed', 'gaitSpeed', 'x', 2);
bindMvSlider('mv-radius', 'val-mv-radius', 'pathRadius', 'm', 1, true);
bindMvSlider('mv-smooth', 'val-mv-smooth', 'smoothness', '', 2);
bindMvSlider('mv-breath', 'val-mv-breath', 'cadBreathing', '', 2);
bindMvSlider('mv-lag', 'val-mv-lag', 'cameraLag', '', 2);

document.getElementById('mv-btn-reset').addEventListener('click', () => {
  hybridMovement.applyConfig({
    mode: 'figure_eight', stiffness: 115, damping: 16, smoothness: 0.78,
    pathRadius: 3.4, gaitSpeed: 1.0, easeCurve: 'quintic', cadBreathing: 0.35, cameraLag: 0.55
  });
  syncMovementUi();
  movementApp.rebuildTrajectoryVisual();
});

function syncMovementUi() {
  const c = hybridMovement.config;
  mvModeSelect.value = c.mode;
  mvEaseSelect.value = c.easeCurve;
  document.getElementById('mv-stiffness').value = c.stiffness;
  document.getElementById('val-mv-stiff').textContent = Math.round(c.stiffness);
  document.getElementById('mv-damping').value = c.damping;
  document.getElementById('val-mv-damp').textContent = Math.round(c.damping);
  document.getElementById('mv-speed').value = c.gaitSpeed;
  document.getElementById('val-mv-speed').textContent = `${Number(c.gaitSpeed).toFixed(2)}x`;
  document.getElementById('mv-radius').value = c.pathRadius;
  document.getElementById('val-mv-radius').textContent = `${Number(c.pathRadius).toFixed(1)}m`;
  document.getElementById('mv-smooth').value = c.smoothness;
  document.getElementById('val-mv-smooth').textContent = Number(c.smoothness).toFixed(2);
  document.getElementById('mv-breath').value = c.cadBreathing;
  document.getElementById('val-mv-breath').textContent = Number(c.cadBreathing).toFixed(2);
  document.getElementById('mv-lag').value = c.cameraLag;
  document.getElementById('val-mv-lag').textContent = Number(c.cameraLag).toFixed(2);
}

// 10. Hybrid Scene Designer Wiring (Linked to Matrix, Video, Text2Movie)
const scBiomeSelect = document.getElementById('sc-biome-select');
const scExportJsonBtn = document.getElementById('sc-btn-export-json');
let sceneJsonUrl = null;

function refreshSceneJsonLink() {
  if (sceneJsonUrl) URL.revokeObjectURL(sceneJsonUrl);
  const blob = new Blob([JSON.stringify(hybridScene.config, null, 2)], { type: 'application/json' });
  sceneJsonUrl = URL.createObjectURL(blob);
  scExportJsonBtn.href = sceneJsonUrl;
  scExportJsonBtn.download = `hybrid-scene-${hybridScene.config.biome}.json`;
}

function syncSceneUi() {
  const c = hybridScene.config;
  scBiomeSelect.value = c.biome;
  document.getElementById('sc-fog').value = c.fogDensity;
  document.getElementById('val-sc-fog').textContent = Number(c.fogDensity).toFixed(3);
  document.getElementById('sc-keyint').value = c.keyIntensity;
  document.getElementById('val-sc-keyint').textContent = Number(c.keyIntensity).toFixed(2);
  document.getElementById('sc-keyelev').value = c.keyElevation;
  document.getElementById('val-sc-keyelev').textContent = `${c.keyElevation}m`;
  document.getElementById('sc-sunscale').value = c.sunScale;
  document.getElementById('val-sc-sunscale').textContent = `${Number(c.sunScale).toFixed(2)}x`;
  document.getElementById('sc-gridscale').value = c.gridScale;
  document.getElementById('val-sc-gridscale').textContent = Number(c.gridScale).toFixed(2);
  document.getElementById('sc-mariox').value = c.marioPos[0];
  document.getElementById('val-sc-mariox').textContent = `${Number(c.marioPos[0]).toFixed(1)}m`;
  document.getElementById('sc-promox').value = c.promoPos[0];
  document.getElementById('val-sc-promox').textContent = `${Number(c.promoPos[0]).toFixed(1)}m`;
  document.getElementById('sc-rim-color').value = c.rimColor;
  document.getElementById('sc-grid-color').value = c.gridColor;
  refreshSceneJsonLink();
}
syncSceneUi();

scBiomeSelect.addEventListener('change', () => {
  hybridScene.applyBiome(scBiomeSelect.value);
  syncSceneUi();
});

function bindSceneSlider(id, valId, key, decimals = 2, suffix = '') {
  document.getElementById(id).addEventListener('input', (e) => {
    const v = Number(e.target.value);
    document.getElementById(valId).textContent = `${v.toFixed(decimals)}${suffix}`;
    hybridScene.applyConfig({ [key]: v });
    refreshSceneJsonLink();
  });
}
bindSceneSlider('sc-fog', 'val-sc-fog', 'fogDensity', 3);
bindSceneSlider('sc-keyint', 'val-sc-keyint', 'keyIntensity', 2);
bindSceneSlider('sc-keyelev', 'val-sc-keyelev', 'keyElevation', 0, 'm');
bindSceneSlider('sc-sunscale', 'val-sc-sunscale', 'sunScale', 2, 'x');
bindSceneSlider('sc-gridscale', 'val-sc-gridscale', 'gridScale', 2);

document.getElementById('sc-mariox').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  document.getElementById('val-sc-mariox').textContent = `${v.toFixed(1)}m`;
  hybridScene.applyConfig({ marioPos: [v, hybridScene.config.marioPos[1]] });
  refreshSceneJsonLink();
});
document.getElementById('sc-promox').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  document.getElementById('val-sc-promox').textContent = `${v.toFixed(1)}m`;
  hybridScene.applyConfig({ promoPos: [v, hybridScene.config.promoPos[1]] });
  refreshSceneJsonLink();
});
document.getElementById('sc-rim-color').addEventListener('input', (e) => {
  hybridScene.applyConfig({ rimColor: e.target.value });
  refreshSceneJsonLink();
});
document.getElementById('sc-grid-color').addEventListener('input', (e) => {
  hybridScene.applyConfig({ gridColor: e.target.value });
  refreshSceneJsonLink();
});

// 11. Concept Production Matrix & 6 Daemons Wiring
const matrixLayerChecks = {
  cad: document.getElementById('mx-layer-cad'),
  sun: document.getElementById('mx-layer-sun'),
  mario: document.getElementById('mx-layer-mario'),
  grid: document.getElementById('mx-layer-grid'),
  promo: document.getElementById('mx-layer-promo')
};
Object.entries(matrixLayerChecks).forEach(([key, chk]) => {
  chk.addEventListener('change', () => {
    matrixEngine.layers[key] = chk.checked;
  });
});

document.getElementById('mx-camera-select').addEventListener('change', (e) => {
  matrixEngine.cameraMode = e.target.value;
});
document.getElementById('mx-exposure').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  matrixEngine.renderer.toneMappingExposure = v;
  document.getElementById('val-mx-exposure').textContent = v.toFixed(2);
});
document.getElementById('mx-cad-scale').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  matrixEngine.cadScale = v;
  document.getElementById('val-mx-scale').textContent = `${v.toFixed(2)}x`;
});
document.getElementById('mx-spin-boost').addEventListener('input', (e) => {
  const v = Number(e.target.value);
  matrixEngine.cadSpinBoost = v;
  document.getElementById('val-mx-spin').textContent = `${v.toFixed(1)}x`;
});
document.getElementById('mx-btn-open-video').addEventListener('click', () => {
  wm.open('win-video');
  syncStudioLoops();
});

// Populate 6 Daemons Controls
const daemonListEl = document.getElementById('daemon-list');
const daemonFpsReadout = document.getElementById('daemon-fps-readout');
daemonSupervisor.getList().forEach((d) => {
  const row = document.createElement('label');
  row.className = 'daemon-row';
  row.innerHTML = `
    <div class="daemon-meta">
      <span class="daemon-name">${d.name}</span>
      <span class="daemon-desc">${d.desc}</span>
    </div>
    <input type="checkbox" ${d.enabled ? 'checked' : ''} data-daemon-id="${d.id}" />
  `;
  row.querySelector('input').addEventListener('change', (e) => {
    daemonSupervisor.toggleDaemon(d.id, e.target.checked);
  });
  daemonListEl.appendChild(row);
});

// 12. Black Glass Video Studio Wiring
const videoPrompt = document.getElementById('vid-prompt-input');
const videoBtnEvoke = document.getElementById('vid-btn-evoke');
const videoStatus = document.getElementById('vid-status');
const videoShotStrip = document.getElementById('vid-shot-strip');
const videoTimecode = document.getElementById('vid-timecode');
const videoBtnPlay = document.getElementById('vid-btn-play');
const videoBtnExport = document.getElementById('vid-btn-export');
const videoDownloadLink = document.getElementById('vid-download-link');
const videoPromoInput = document.getElementById('vid-promo-input');
const videoFpsSelect = document.getElementById('vid-fps-select');

function renderShotStrip() {
  videoShotStrip.innerHTML = '';
  const active = videoApp.getActiveShot();
  videoApp.movie.shots.forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'shot-chip' + (idx === active.index ? ' is-active' : '');
    btn.innerHTML = `<span class="shot-title">${s.label}</span><span class="shot-meta">${s.duration}s · ${s.camera}</span>`;
    btn.addEventListener('click', () => {
      videoApp.jumpToShot(idx);
      renderShotStrip();
    });
    videoShotStrip.appendChild(btn);
  });
}
renderShotStrip();

videoApp.onShotChange = () => {
  renderShotStrip();
  Object.entries(matrixLayerChecks).forEach(([k, chk]) => {
    chk.checked = Boolean(matrixEngine.layers[k]);
  });
};

document.getElementById('vid-preset-select').addEventListener('change', (e) => {
  const p = MOVIE_PRESETS[e.target.value];
  if (p) {
    videoApp.setMovie(JSON.parse(JSON.stringify(p)));
    videoStatus.classList.remove('is-error');
    videoStatus.textContent = `${p.title} — ${p.tagline}`;
    renderShotStrip();
  }
});

document.getElementById('vid-promo-btn').addEventListener('click', () => videoPromoInput.click());
videoPromoInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  videoApp.setPromoFile(file);
  videoStatus.classList.remove('is-error');
  videoStatus.textContent = `Loaded promo asset: ${file.name}`;
});

document.getElementById('vid-promo-mode').addEventListener('change', (e) => {
  videoApp.promoMode = e.target.value;
});

videoBtnEvoke.addEventListener('click', async () => {
  const prompt = videoPrompt.value.trim();
  if (!prompt && !videoApp.promoImageDataUrl && !videoApp.promoName) {
    videoStatus.textContent = 'Write a movie prompt or upload a promo image/video first.';
    videoStatus.classList.add('is-error');
    return;
  }
  videoBtnEvoke.disabled = true;
  videoBtnEvoke.textContent = 'Directing...';
  videoStatus.classList.remove('is-error');
  videoStatus.textContent = 'Directing multi-shot 1080p scene with Gemini...';

  try {
    const res = await fetch('/api/gemini/movie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        promoName: videoApp.promoName,
        imageDataUrl: videoApp.promoImageDataUrl
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Movie generation failed');
    videoApp.setMovie(data.movie);
    videoApp.playing = true;
    videoBtnPlay.textContent = 'Pause';
    videoStatus.textContent = `${data.movie.title} — ${data.movie.tagline}`;
    renderShotStrip();
  } catch (err) {
    videoStatus.textContent = err.message;
    videoStatus.classList.add('is-error');
  } finally {
    videoBtnEvoke.disabled = false;
    videoBtnEvoke.textContent = 'Evoke Movie Scene';
  }
});

videoBtnPlay.addEventListener('click', () => {
  videoApp.playing = !videoApp.playing;
  videoBtnPlay.textContent = videoApp.playing ? 'Pause' : 'Play';
});

function startMovieExport(fps) {
  if (videoApp.recording) {
    videoApp.stopRecording();
    return;
  }
  videoDownloadLink.classList.add('is-hidden');
  t2mDlWebm.classList.add('is-hidden');
  const started = videoApp.startFullHdRecording(fps);
  if (!started) {
    const msg = 'Full HD MediaRecorder is not supported in this browser.';
    videoStatus.textContent = msg;
    videoStatus.classList.add('is-error');
    t2mStatus.textContent = msg;
    t2mStatus.classList.add('is-error');
    return;
  }
  videoBtnExport.textContent = 'Stop Export';
  t2mBtnExportWebm.textContent = 'Stop Export';
}

videoBtnExport.addEventListener('click', () => {
  startMovieExport(Number(videoFpsSelect.value) || 30);
});

// 13. Single-Prompt Text-to-Movie Window Wiring
const t2mPrompt = document.getElementById('t2m-prompt-input');
const t2mDurationSelect = document.getElementById('t2m-duration-select');
const t2mFpsSelect = document.getElementById('t2m-fps-select');
const t2mBtnGenerate = document.getElementById('t2m-btn-generate');
const t2mRecipeSelect = document.getElementById('t2m-recipe-select');
const t2mStatus = document.getElementById('t2m-status');
const t2mProgress = document.getElementById('t2m-progress');
const t2mBtnExportWebm = document.getElementById('t2m-btn-export-webm');
const t2mDlWebm = document.getElementById('t2m-dl-webm');
const t2mBtnExportPng = document.getElementById('t2m-btn-export-png');
const t2mDlJson = document.getElementById('t2m-dl-json');
const t2mDlTxt = document.getElementById('t2m-dl-txt');

function refreshT2mLinks() {
  const { jsonUrl, scriptUrl } = t2mApp.generateTextAndJsonExports();
  const slug = (t2mApp.currentPackage.title || 'black-glass-movie').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  t2mDlJson.href = jsonUrl;
  t2mDlJson.download = `${slug}-scene.json`;
  t2mDlTxt.href = scriptUrl;
  t2mDlTxt.download = `${slug}-script.txt`;
}
refreshT2mLinks();

t2mRecipeSelect.addEventListener('change', () => {
  const recipe = TEXT2MOVIE_RECIPES[t2mRecipeSelect.value];
  if (!recipe) return;
  t2mApp.applyPackage(JSON.parse(JSON.stringify(recipe)));
  syncMovementUi();
  syncSceneUi();
  movementApp.rebuildTrajectoryVisual();
  updateCadMeta();
  renderShotStrip();
  refreshT2mLinks();
  t2mStatus.classList.remove('is-error');
  t2mStatus.textContent = `${recipe.title} — ${recipe.tagline}`;
});

t2mBtnGenerate.addEventListener('click', async () => {
  const prompt = t2mPrompt.value.trim();
  if (!prompt) {
    t2mStatus.textContent = 'Enter a single movie prompt or choose a starter recipe.';
    t2mStatus.classList.add('is-error');
    return;
  }
  t2mBtnGenerate.disabled = true;
  t2mBtnGenerate.textContent = 'Generating...';
  t2mStatus.classList.remove('is-error');
  t2mStatus.textContent = 'Generating unified 3D scene, movement rig, CAD centerpiece & shot script...';

  try {
    const res = await fetch('/api/gemini/text2movie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: Number(t2mDurationSelect.value) || 12 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Movie package generation failed');
    t2mApp.applyPackage(data.package);
    syncMovementUi();
    syncSceneUi();
    movementApp.rebuildTrajectoryVisual();
    updateCadMeta();
    renderShotStrip();
    refreshT2mLinks();
    t2mStatus.textContent = `${data.package.title} — All systems linked & export files ready.`;
  } catch (err) {
    t2mStatus.textContent = err.message;
    t2mStatus.classList.add('is-error');
  } finally {
    t2mBtnGenerate.disabled = false;
    t2mBtnGenerate.textContent = 'Generate Movie';
  }
});

t2mBtnExportWebm.addEventListener('click', () => {
  startMovieExport(Number(t2mFpsSelect.value) || 30);
});

t2mBtnExportPng.addEventListener('click', () => {
  const pngUrl = t2mApp.capturePosterPng();
  const a = document.createElement('a');
  const slug = (t2mApp.currentPackage.title || 'black-glass').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  a.href = pngUrl;
  a.download = `${slug}-1080p-poster.png`;
  a.click();
  t2mStatus.classList.remove('is-error');
  t2mStatus.textContent = 'Saved 1920×1080 PNG cinema poster frame.';
});

videoApp.onRecordProgress = (pct, frameIdx, totalFrames) => {
  const pctStr = `${Math.round(pct * 100)}%`;
  const msg = `Stepped 1080p Render: frame ${frameIdx}/${totalFrames} (${pctStr})`;
  videoStatus.classList.remove('is-error');
  videoStatus.textContent = msg;
  t2mStatus.classList.remove('is-error');
  t2mStatus.textContent = msg;
  t2mProgress.textContent = pctStr;
  if (isWindowVisible('win-text2movie')) t2mApp.renderPreview();
};

videoApp.onRecordComplete = (url, bytes) => {
  videoBtnExport.textContent = 'Export 1080p HD';
  t2mBtnExportWebm.textContent = 'Export 1080p Movie (.webm)';
  const mb = (bytes / (1024 * 1024)).toFixed(2);
  const fileName = `${(videoApp.movie.title || 'black-glass-movie').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-1080p.webm`;

  videoDownloadLink.href = url;
  videoDownloadLink.download = fileName;
  videoDownloadLink.textContent = `Download 1080p (${mb} MB)`;
  videoDownloadLink.classList.remove('is-hidden');

  t2mDlWebm.href = url;
  t2mDlWebm.download = fileName;
  t2mDlWebm.textContent = `Download .webm (${mb} MB)`;
  t2mDlWebm.classList.remove('is-hidden');

  const readyMsg = `Smooth 1920×1080 movie ready (${mb} MB).`;
  videoStatus.classList.remove('is-error');
  videoStatus.textContent = readyMsg;
  t2mStatus.classList.remove('is-error');
  t2mStatus.textContent = readyMsg;
  t2mProgress.textContent = `1080p Ready · ${mb} MB`;
};

// 14. Physics Studio & Audio Synth OS Windows
const sliderGravity = document.getElementById('slider-gravity');
const sliderSpeed = document.getElementById('slider-speed');
const sliderJump = document.getElementById('slider-jump');
const valGravity = document.getElementById('val-gravity');
const valSpeed = document.getElementById('val-speed');
const valJump = document.getElementById('val-jump');

sliderGravity.addEventListener('input', () => {
  engine.config.gravity = Number(sliderGravity.value);
  valGravity.textContent = `${engine.config.gravity.toFixed(0)} m/s²`;
});
sliderSpeed.addEventListener('input', () => {
  engine.config.moveSpeed = Number(sliderSpeed.value);
  engine.config.sprintSpeed = engine.config.moveSpeed * 1.5;
  valSpeed.textContent = `${engine.config.moveSpeed.toFixed(1)} u/s`;
});
sliderJump.addEventListener('input', () => {
  engine.config.jumpVelocity = Number(sliderJump.value);
  valJump.textContent = `${engine.config.jumpVelocity.toFixed(1)} u/s`;
});

document.getElementById('btn-reset-physics').addEventListener('click', () => {
  engine.config = { gravity: 42.0, moveSpeed: 9.2, sprintSpeed: 13.8, jumpVelocity: 16.4, stompBounce: 11.5 };
  sliderGravity.value = '42';
  sliderSpeed.value = '9.2';
  sliderJump.value = '16.4';
  valGravity.textContent = '42 m/s²';
  valSpeed.textContent = '9.2 u/s';
  valJump.textContent = '16.4 u/s';
});

document.querySelectorAll('[data-jump-world]').forEach((btn) => {
  btn.addEventListener('click', () => {
    engine.selectWorld(Number(btn.dataset.jumpWorld));
    syncOverlays();
  });
});

const sliderVolume = document.getElementById('slider-volume');
const valVolume = document.getElementById('val-volume');
const chkMusic = document.getElementById('chk-music');
const chkSfx = document.getElementById('chk-sfx');

sliderVolume.addEventListener('input', () => {
  const v = Number(sliderVolume.value);
  audio.setVolume(v / 100);
  valVolume.textContent = `${v}%`;
});
chkMusic.addEventListener('change', () => audio.setMusicEnabled(chkMusic.checked));
chkSfx.addEventListener('change', () => { audio.sfxEnabled = chkSfx.checked; });
document.querySelectorAll('[data-sfx-test]').forEach((btn) => {
  btn.addEventListener('click', () => audio.playSfx(btn.dataset.sfxTest));
});

// 15. HUD & Telemetry Sync
const hudScore = document.getElementById('hud-score');
const hudHigh = document.getElementById('hud-high');
const hudCoins = document.getElementById('hud-coins');
const hudWorld = document.getElementById('hud-world');
const hudPower = document.getElementById('hud-power');
const hudTime = document.getElementById('hud-time');
const hudLives = document.getElementById('hud-lives');
const telPos = document.getElementById('tel-pos');
const telVel = document.getElementById('tel-vel');
const telState = document.getElementById('tel-state');

function updateHud() {
  hudScore.textContent = String(engine.score).padStart(6, '0');
  hudHigh.textContent = String(engine.highScore).padStart(6, '0');
  hudCoins.textContent = String(engine.coins).padStart(2, '0');
  hudWorld.textContent = engine.level.id;
  const powerName = engine.player.starTimer > 0 ? 'Star' : (engine.player.power === 'fire' ? 'Fire' : engine.player.power === 'super' ? 'Super' : 'Small');
  hudPower.textContent = powerName;
  hudTime.textContent = String(Math.ceil(engine.timeLeft)).padStart(3, '0');
  hudLives.textContent = String(engine.lives);

  telPos.textContent = `${engine.player.x.toFixed(1)}, ${engine.player.y.toFixed(1)}`;
  telVel.textContent = `${engine.player.vx.toFixed(1)}, ${engine.player.vy.toFixed(1)}`;
  telState.textContent = `${engine.state} · ${renderMode.toUpperCase()}`;

  const totalDur = videoApp.getTotalDuration();
  videoTimecode.textContent = `${videoApp.currentTime.toFixed(1)}s / ${totalDur.toFixed(1)}s`;
  daemonFpsReadout.textContent = `${daemonSupervisor.daemons.framePacer.fps} fps`;
}

// 16. Master Animation Loop
let lastTime = performance.now();
let accumulator = 0;
const FIXED_DT = 1 / 60;
let prevEngineState = engine.state;

function tick(now) {
  const frameDt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const marioVisible = isWindowVisible('win-mario');
  if (marioVisible) {
    accumulator += frameDt;
    while (accumulator >= FIXED_DT) {
      engine.step(FIXED_DT);
      accumulator -= FIXED_DT;
    }
    if (engine.state !== prevEngineState) {
      prevEngineState = engine.state;
      syncOverlays();
    }
  }

  // Render Production Matrix preview if open and not locked by deterministic export
  if (isWindowVisible('win-matrix') && !videoApp.recording) {
    matrixEngine.renderToCanvas(matrixPreviewCanvas, frameDt, false, false, 30);
  }

  // Render Black Glass Video or Text2Movie live preview
  const videoVisible = isWindowVisible('win-video');
  const t2mVisible = isWindowVisible('win-text2movie');
  if (!videoApp.recording && (videoVisible || t2mVisible)) {
    videoApp.renderFrame(frameDt, true);
    if (t2mVisible) t2mApp.renderPreview();
  }

  // Render Mario 2D or 3D
  if (marioVisible) {
    if (renderMode === '2d') {
      renderer2D.render(engine);
      requestAnimationFrame(tick);
    } else {
      renderer3D.render(engine, frameDt);
      renderer3D.afterDraw(() => tick(performance.now()));
    }
  } else {
    requestAnimationFrame(tick);
  }

  updateHud();
}

syncOverlays();
requestAnimationFrame(tick);
