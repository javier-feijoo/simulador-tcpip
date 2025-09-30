import { state, resetScenarioState } from './state.js';
import { getDomRefs } from './dom.js';
import { initAdvanced, toggleAdvancedMode } from './advanced.js';
import { loadScenarios, getScenarioById, getInitialScenarioId } from './scenarios.js';
import { initPlayback } from './playback.js';
import { buildTimeline, highlightTimeline, renderScenarioInfo, renderStep } from './view.js';

const dom = getDomRefs();

initAdvanced(dom, {
  onModeChange: () => {
    renderCurrentStep();
  },
});

const playback = initPlayback(dom, {
  onStepChange: (index) => {
    state.currentStep = index;
  },
  getScenario: () => getScenarioById(state.activeScenarioId),
  onRender: () => {
    renderCurrentStep();
    playback.updateNavigationButtons();
  },
});

async function bootstrap() {
  try {
    dom.scenarioTitle.textContent = 'Cargando escenarios…';
    const { defaultScenarioId, scenarios } = await loadScenarios();
    populateScenarioSelect(scenarios, getInitialScenarioId(defaultScenarioId));
    const initialId = getInitialScenarioId(defaultScenarioId);
    if (initialId) {
      selectScenario(initialId);
    } else {
      dom.scenarioTitle.textContent = 'No hay escenarios disponibles';
    }
  } catch (error) {
    dom.scenarioTitle.textContent = 'Error al cargar escenarios';
    dom.eventLog.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = error.message ?? 'No se pudieron cargar los datos.';
    dom.eventLog.appendChild(li);
  }
}

function populateScenarioSelect(scenarios, selectedId) {
  dom.scenarioSelect.innerHTML = '';
  scenarios.forEach((scenario) => {
    const option = document.createElement('option');
    option.value = scenario.id;
    option.textContent = scenario.title;
    if (scenario.id === selectedId) {
      option.selected = true;
    }
    dom.scenarioSelect.appendChild(option);
  });
}

dom.scenarioSelect.addEventListener('change', (event) => {
  const { value } = event.target;
  selectScenario(value);
});

function selectScenario(id) {
  const scenario = getScenarioById(id);
  if (!scenario) return;

  playback.stopPlayback();
  resetScenarioState();
  state.activeScenarioId = id;
  state.currentStep = 0;
  state.currentStepData = null;

  renderScenarioInfo(dom, scenario);

  buildTimeline(dom, scenario, (index) => {
    playback.stopPlayback();
    goToStep(index);
  });

  updateScenarioTitle(scenario);
  goToStep(0, { silent: true });
  playback.updateNavigationButtons();
}

function updateScenarioTitle(scenario) {
  if (!scenario) {
    dom.scenarioTitle.textContent = '';
    return;
  }

  dom.scenarioTitle.textContent = scenario.summary
    ? `${scenario.title} · ${scenario.summary}`
    : scenario.title;
}

function goToStep(index, { silent = false } = {}) {
  const scenario = getScenarioById(state.activeScenarioId);
  if (!scenario) return;
  const maxIndex = Math.max(0, scenario.steps.length - 1);
  const target = Math.min(maxIndex, Math.max(0, index));
  state.currentStep = target;
  state.currentStepData = scenario.steps[target] ?? null;
  if (!silent) {
    playback.stopPlayback();
  }
  renderCurrentStep();
  playback.updateNavigationButtons();
}

function renderCurrentStep() {
  const scenario = getScenarioById(state.activeScenarioId);
  if (!scenario) return;
  updateScenarioTitle(scenario);

  const step = scenario.steps[state.currentStep];
  state.currentStepData = step;
  renderStep(dom, scenario, step);
  highlightTimeline(state.currentStep);
}

bootstrap();

// expose for debugging
window.__tcpipSimulator = {
  state,
  goToStep,
  selectScenario,
  toggleAdvancedMode,
};
