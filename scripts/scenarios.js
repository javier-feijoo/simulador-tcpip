import { state, resetScenarioState } from './state.js';

function normalizeSegment(segment, index) {
  const base = segment || {};
  return {
    id: base.id ?? String.fromCharCode(65 + index),
    label: base.label ?? base.id ?? `Elemento ${index + 1}`,
    seq: Number(base.seq ?? index + 1),
    bytes: base.bytes ?? '',
    status: base.status ?? '',
    description: base.description ?? '',
  };
}

function normalizeChallenge(step, scenarioId) {
  const challenge = step.challenge;
  if (!challenge) return null;

  const normalized = {
    type: challenge.type ?? 'reorder',
    title: challenge.title ?? step.title,
    prompt: challenge.prompt ?? '',
    data: challenge.data ?? {},
  };

  if (challenge.segments) {
    normalized.segments = challenge.segments.map(normalizeSegment);
  }

  if (challenge.options) {
    normalized.options = challenge.options.map((option, index) => ({
      id: option.id ?? `option-${index + 1}`,
      label: option.label ?? option.text ?? `Opción ${index + 1}`,
      correct: Boolean(option.correct),
      explanation: option.explanation ?? '',
    }));
  }

  if (challenge.actions) {
    normalized.actions = challenge.actions.map((action, index) => ({
      id: action.id ?? `action-${index + 1}`,
      label: action.label ?? `Acción ${index + 1}`,
      effect: action.effect ?? '',
      result: action.result ?? '',
    }));
  }

  normalized.retryLabel = challenge.retryLabel ?? 'Reintentar';
  normalized.successLabel = challenge.successLabel ?? '¡Correcto!';
  normalized.errorLabel = challenge.errorLabel ?? 'Vuelve a intentarlo.';

  normalized.meta = {
    scenario: scenarioId,
    step: step.id,
  };

  return normalized;
}

function normalizeStep(step, scenarioId) {
  const normalizedStep = {
    ...step,
    id: step.id ?? ((typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') ? globalThis.crypto.randomUUID() : `step-${Math.random().toString(16).slice(2)}`),
    layers: Array.isArray(step.layers)
      ? step.layers.map((layer) => ({
          name: layer?.name ?? 'Capa',
          protocol: layer?.protocol ?? '',
          info: layer?.info ?? '',
          active: Boolean(layer?.active),
        }))
      : [],
    packet: step.packet ?? null,
    events: Array.isArray(step.events) ? step.events : [],
  };

  const challenge = normalizeChallenge(normalizedStep, scenarioId);
  if (challenge) {
    normalizedStep.challenge = challenge;
  }

  return normalizedStep;
}

function normalizeScenario(scenario) {
  const normalized = {
    ...scenario,
    id: scenario.id ?? `scenario-${Math.random().toString(16).slice(2)}`,
    title: scenario.title ?? 'Escenario sin título',
    summary: scenario.summary ?? '',
    steps: Array.isArray(scenario.steps)
      ? scenario.steps.map((step) => normalizeStep(step, scenario.id))
      : [],
    glossary: Array.isArray(scenario.glossary) ? scenario.glossary : [],
    references: Array.isArray(scenario.references) ? scenario.references : [],
  };

  return normalized;
}

export async function loadScenarios(url = 'scenarios.json') {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`No se pudieron cargar los escenarios (${response.status})`);
  }

  const data = await response.json();
  const scenarios = Array.isArray(data.scenarios) ? data.scenarios.map(normalizeScenario) : [];

  state.scenarios = scenarios;
  state.scenarioMap = new Map(scenarios.map((item) => [item.id, item]));

  resetScenarioState();

  return {
    defaultScenarioId: data.defaultScenarioId ?? scenarios[0]?.id ?? null,
    scenarios,
  };
}

export function getScenarioById(id) {
  return state.scenarioMap.get(id) || null;
}

export function getInitialScenarioId(preferredId) {
  if (preferredId && state.scenarioMap.has(preferredId)) {
    return preferredId;
  }
  const [first] = state.scenarios;
  return first ? first.id : null;
}
