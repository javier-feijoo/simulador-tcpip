export const state = {
  scenarios: [],
  scenarioMap: new Map(),
  activeScenarioId: null,
  currentStep: 0,
  currentStepData: null,
  isPlaying: false,
  speed: 1,
  playTimer: null,
  challengeState: {},
  quizState: {},
  advancedMode: false,
};

export function getScenarioKey(scenarioId, stepId) {
  return `${scenarioId ?? ''}:${stepId ?? ''}`;
}

export function resetScenarioState() {
  state.challengeState = {};
  state.quizState = {};
}
