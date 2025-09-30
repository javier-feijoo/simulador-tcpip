import { state, getScenarioKey } from './state.js';

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ensureState(key, initializer) {
  if (!state.challengeState[key]) {
    state.challengeState[key] = typeof initializer === 'function' ? initializer() : initializer;
  }
  return state.challengeState[key];
}

export function renderChallenge(container, scenario, step) {
  const challenge = step.challenge;
  container.classList.remove('challenge-completed');
  container.innerHTML = '';

  if (!challenge) {
    return;
  }

  const title = document.createElement('h3');
  title.textContent = challenge.title || 'Reto interactivo';
  container.appendChild(title);

  if (challenge.prompt) {
    const prompt = document.createElement('p');
    prompt.className = 'challenge-prompt';
    prompt.textContent = challenge.prompt;
    container.appendChild(prompt);
  }

  const body = document.createElement('div');
  body.className = 'challenge-body';
  container.appendChild(body);

  const key = getScenarioKey(scenario.id, step.id);

  switch (challenge.type) {
    case 'reorder':
      renderReorderChallenge(container, body, key, challenge);
      break;
    case 'error-sim':
    case 'simulate':
      renderSimulationChallenge(container, body, key, challenge);
      break;
    case 'quiz':
      renderQuizChallenge(container, body, key, challenge);
      break;
    default:
      renderFallbackChallenge(body, challenge);
      break;
  }
}

function renderFallbackChallenge(body, challenge) {
  body.innerHTML = '';
  const info = document.createElement('p');
  info.className = 'challenge-status';
  info.textContent = 'Tipo de reto no soportado: ' + challenge.type + '.';
  body.appendChild(info);
}

function descriptorForSegment(segment, index) {
  return (
    segment.description ||
    segment.status ||
    segment.bytes ||
    segment.hint ||
    segment.label ||
    'Paquete ' + (index + 1)
  );
}

function renderReorderChallenge(container, body, key, challenge) {
  body.innerHTML = '';
  const segments = Array.isArray(challenge.segments) ? challenge.segments : [];
  const entry = ensureState(key, function () {
    return {
      order: challenge.shuffle === false ? segments.slice() : shuffle(segments),
      completed: false,
    };
  });

  if (entry.completed) {
    container.classList.add('challenge-completed');
  }

  const list = document.createElement('ul');
  list.className = 'segment-list drag-list';

  entry.order.forEach(function (segment, index) {
    const item = document.createElement('li');
    item.className = 'segment';
    item.draggable = true;
    item.dataset.index = String(index);
    item.dataset.id = segment.id || 'seg-' + index;

    item.addEventListener('dragstart', function (event) {
      item.classList.add('dragging');
      event.dataTransfer.setData('text/plain', item.dataset.index);
      event.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', function () {
      item.classList.remove('dragging');
    });

    item.addEventListener('dragover', function (event) {
      event.preventDefault();
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', function () {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', function (event) {
      event.preventDefault();
      item.classList.remove('drag-over');
      const fromIndex = Number(event.dataTransfer.getData('text/plain'));
      const toIndex = Number(item.dataset.index);
      if (!Number.isNaN(fromIndex) && !Number.isNaN(toIndex) && fromIndex !== toIndex) {
        const moved = entry.order.splice(fromIndex, 1)[0];
        entry.order.splice(toIndex, 0, moved);
        renderReorderChallenge(container, body, key, challenge);
      }
    });

    const handle = document.createElement('span');
    handle.className = 'segment-handle';
    handle.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">drag_indicator</span>';

    const content = document.createElement('div');
    content.className = 'segment-content';

    const title = document.createElement('span');
    title.className = 'segment-title';
    title.textContent = descriptorForSegment(segment, index);
    content.appendChild(title);

    const metaParts = [];
    if (segment.status && segment.status !== title.textContent) metaParts.push(segment.status);
    if (segment.bytes && segment.bytes !== title.textContent) metaParts.push(segment.bytes);
    if (segment.hint) metaParts.push(segment.hint);

    if (metaParts.length) {
      const meta = document.createElement('span');
      meta.className = 'segment-meta';
      meta.textContent = metaParts.join(' â€¢ ');
      content.appendChild(meta);
    }

    item.append(handle, content);
    list.appendChild(item);
  });

  const controls = document.createElement('div');
  controls.className = 'challenge-actions';

  const checkButton = document.createElement('button');
  checkButton.type = 'button';
  checkButton.className = 'primary-button icon-button';
  checkButton.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">check_circle</span>';
  checkButton.title = 'Comprobar orden';
  checkButton.setAttribute('aria-label', 'Comprobar orden');
  controls.appendChild(checkButton);

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'ghost-button icon-button';
  resetButton.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">shuffle</span>';
  resetButton.title = 'Reordenar segmentos';
  resetButton.setAttribute('aria-label', 'Reordenar segmentos');
  controls.appendChild(resetButton);

  const status = document.createElement('p');
  status.className = 'challenge-status';
  if (entry.completed) {
    status.textContent = challenge.successLabel || 'Â¡Orden correcto!';
  }

  checkButton.addEventListener('click', function () {
    const expected = segments.slice().sort(function (a, b) { return Number(a.seq) - Number(b.seq); });
    const correct = expected.every(function (segment, idx) {
      return segment.id === entry.order[idx]?.id;
    });
    entry.completed = correct;
    container.classList.toggle('challenge-completed', correct);
    status.textContent = correct
      ? (challenge.successLabel || 'Â¡Orden correcto!')
      : (challenge.errorLabel || 'AÃºn hay paquetes desordenados.');
  });

  resetButton.addEventListener('click', function () {
    entry.order = challenge.shuffle === false ? segments.slice() : shuffle(segments);
    entry.completed = false;
    renderReorderChallenge(container, body, key, challenge);
  });

  body.append(list, controls, status);
}

function renderSimulationChallenge(container, body, key, challenge) {
  body.innerHTML = '';
  const entry = ensureState(key, function () {
    return { history: [], completed: false };
  });
  container.classList.toggle('challenge-completed', Boolean(entry.completed));

  const actionsWrapper = document.createElement('div');
  actionsWrapper.className = 'simulation-actions';

  (challenge.actions || []).forEach(function (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost-button';
    button.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">bolt</span> ' + (action.label || 'Acción');
    button.title = action.label || 'AcciÃ³n';
    button.addEventListener('click', function () {
      entry.history.push(action.result || 'Evento simulado.');
      renderSimulationChallenge(container, body, key, challenge);
    });
    actionsWrapper.appendChild(button);
  });

  const log = document.createElement('div');
  log.className = 'simulation-log';

  if (!entry.history.length) {
    const placeholder = document.createElement('p');
    placeholder.className = 'empty-state';
    placeholder.textContent = 'AÃºn no has inyectado eventos.';
    log.appendChild(placeholder);
  } else {
    entry.history.slice(-5).forEach(function (message) {
      const item = document.createElement('p');
      item.textContent = message;
      log.appendChild(item);
    });
  }

  body.append(actionsWrapper, log);
}

function renderQuizChallenge(container, body, key, challenge) {
  body.innerHTML = '';
  const entry = ensureState(key, function () {
    return { answer: null, completed: false };
  });
  container.classList.toggle('challenge-completed', Boolean(entry.completed));

  const form = document.createElement('form');
  form.className = 'quiz-form';

  const question = document.createElement('p');
  question.className = 'quiz-question';
  question.textContent = challenge.question || 'Selecciona la respuesta correcta.';
  form.appendChild(question);

  (challenge.options || []).forEach(function (option, index) {
    const id = key + '-opt-' + index;
    const label = document.createElement('label');
    label.className = 'quiz-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = key + '-options';
    input.value = option.id || 'option-' + index;
    input.id = id;
    input.checked = entry.answer === input.value;

    input.addEventListener('change', function () {
      entry.answer = input.value;
    });

    const span = document.createElement('span');
    span.textContent = option.label || 'OpciÃ³n ' + (index + 1);

    label.append(input, span);
    form.appendChild(label);
  });

  const controls = document.createElement('div');
  controls.className = 'challenge-actions';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'primary-button icon-button';
  submit.innerHTML = '<span class="material-icons-outlined" aria-hidden="true">check</span>';
  submit.title = 'Comprobar respuesta';
  submit.setAttribute('aria-label', 'Comprobar respuesta');
  controls.appendChild(submit);

  const feedback = document.createElement('p');
  feedback.className = 'challenge-status';
  if (entry.completed) {
    feedback.textContent = challenge.successLabel || 'Â¡Respuesta correcta!';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!entry.answer) {
      feedback.textContent = 'Selecciona una respuesta.';
      return;
    }

    const selected = (challenge.options || []).find(function (option) {
      return (option.id || '') === entry.answer;
    });

    if (selected && selected.correct) {
      feedback.textContent = challenge.successLabel || 'Â¡Respuesta correcta!';
      entry.completed = true;
      container.classList.add('challenge-completed');
    } else {
      feedback.textContent = (selected && selected.explanation) || challenge.errorLabel || 'Revisa la teorÃ­a y vuelve a intentarlo.';
      entry.completed = false;
      container.classList.remove('challenge-completed');
    }
  });

  form.appendChild(controls);
  body.append(form, feedback);
}







