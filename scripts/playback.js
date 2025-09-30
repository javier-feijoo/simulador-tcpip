import { state } from './state.js';

const BASE_INTERVAL = 3200;

export function initPlayback(dom, handlers) {
  const {
    onStepChange = () => {},
    getScenario = () => null,
    onRender = () => {},
  } = handlers || {};

  dom.controls.back.addEventListener('click', () => changeStep(-1));
  dom.controls.forward.addEventListener('click', () => changeStep(1));
  dom.controls.play.addEventListener('click', startPlayback);
  dom.controls.pause.addEventListener('click', stopPlayback);
  dom.controls.reset.addEventListener('click', reset);
  dom.controls.speedSlider.addEventListener('input', handleSpeedChange);

  function changeStep(delta) {
    const scenario = getScenario();
    if (!scenario) return;
    const maxIndex = Math.max(0, scenario.steps.length - 1);
    const next = Math.min(maxIndex, Math.max(0, state.currentStep + delta));
    if (next === state.currentStep) return;
    state.currentStep = next;
    onStepChange(next);
    onRender();
  }

  function goToStep(index) {
    const scenario = getScenario();
    if (!scenario) return;
    const maxIndex = Math.max(0, scenario.steps.length - 1);
    const target = Math.min(maxIndex, Math.max(0, index));
    if (target === state.currentStep) return;
    state.currentStep = target;
    onStepChange(target);
    onRender();
  }

  function startPlayback() {
    const scenario = getScenario();
    if (!scenario || state.isPlaying) return;
    state.isPlaying = true;
    updateButtons();
    const interval = Math.max(1200, BASE_INTERVAL / state.speed);
    state.playTimer = window.setInterval(() => {
      const maxIndex = Math.max(0, scenario.steps.length - 1);
      if (state.currentStep >= maxIndex) {
        stopPlayback();
        return;
      }
      state.currentStep += 1;
      onStepChange(state.currentStep);
      onRender();
    }, interval);
  }

  function stopPlayback() {
    if (!state.isPlaying) return;
    state.isPlaying = false;
    if (state.playTimer) {
      window.clearInterval(state.playTimer);
      state.playTimer = null;
    }
    updateButtons();
  }

  function reset() {
    stopPlayback();
    state.currentStep = 0;
    state.currentStepData = null;
    onStepChange(state.currentStep);
    onRender();
  }

  function handleSpeedChange(event) {
    const value = Number(event.target.value);
    if (!Number.isNaN(value)) {
      state.speed = value;
      dom.controls.speedLabel.textContent = `${value.toFixed(2).replace(/\.00$/, '')}x`;
      if (state.isPlaying) {
        stopPlayback();
        startPlayback();
      }
    }
  }

  function updateButtons() {
    dom.controls.play.disabled = state.isPlaying;
    dom.controls.pause.disabled = !state.isPlaying;
  }

  function updateNavigationButtons() {
    const scenario = getScenario();
    const hasScenario = Boolean(scenario);
    const maxIndex = hasScenario ? Math.max(0, scenario.steps.length - 1) : 0;
    dom.controls.back.disabled = !hasScenario || state.currentStep <= 0;
    dom.controls.forward.disabled = !hasScenario || state.currentStep >= maxIndex;
    dom.controls.reset.disabled = !hasScenario || (state.currentStep === 0 && !state.isPlaying);
  }

  return {
    goToStep,
    changeStep,
    startPlayback,
    stopPlayback,
    reset,
    updateNavigationButtons,
    isPlaying: () => state.isPlaying,
  };
}
