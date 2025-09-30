import { state } from './state.js';
import { hasPacketFields, updateAdvancedButton } from './advanced.js';
import { renderChallenge } from './challenges.js';

let timelineButtons = [];

export function buildTimeline(dom, scenario, onSelectStep) {
  timelineButtons = [];
  dom.timelineList.innerHTML = '';

  if (!scenario || !Array.isArray(scenario.steps)) {
    return;
  }

  scenario.steps.forEach((step, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timeline-button';
    button.textContent = step.title;
    button.addEventListener('click', () => {
      onSelectStep(index);
    });
    li.appendChild(button);
    dom.timelineList.appendChild(li);
    timelineButtons.push(button);
  });
}

export function highlightTimeline(index) {
  timelineButtons.forEach((button, idx) => {
    if (idx === index) {
      button.classList.add('active');
      button.setAttribute('aria-current', 'step');
    } else {
      button.classList.remove('active');
      button.removeAttribute('aria-current');
    }
  });
}

export function renderScenarioInfo(dom, scenario) {
  const glossary = Array.isArray(scenario?.glossary) ? scenario.glossary : [];
  dom.glossaryList.innerHTML = '';

  if (!glossary.length) {
    const placeholderTerm = document.createElement('dt');
    placeholderTerm.className = 'empty-state';
    placeholderTerm.textContent = 'No hay términos disponibles.';
    const placeholderDef = document.createElement('dd');
    placeholderDef.className = 'empty-state';
    placeholderDef.textContent = 'Añade términos en el archivo de escenarios para mostrarlos aquí.';
    dom.glossaryList.append(placeholderTerm, placeholderDef);
  } else {
    glossary.forEach((entry) => {
      const term = document.createElement('dt');
      term.textContent = entry.term ?? 'Término';
      const definition = document.createElement('dd');
      definition.textContent = entry.definition ?? '';
      dom.glossaryList.append(term, definition);
    });
  }

  const references = Array.isArray(scenario?.references) ? scenario.references : [];
  dom.referencesList.innerHTML = '';

  if (!references.length) {
    const placeholder = document.createElement('li');
    placeholder.className = 'empty-state';
    placeholder.textContent = 'No hay referencias disponibles.';
    dom.referencesList.appendChild(placeholder);
  } else {
    references.forEach((ref) => {
      const item = document.createElement('li');
      if (ref.url) {
        const link = document.createElement('a');
        link.href = ref.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ref.title ?? ref.url;
        item.appendChild(link);
      } else {
        item.textContent = ref.title ?? 'Referencia';
      }
      dom.referencesList.appendChild(item);
    });
  }
}

function renderLayers(dom, layers = []) {
  dom.layerStack.innerHTML = '';

  layers.forEach((layer) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'layer' + (layer?.active ? ' active' : '');

    const layerKey = (layer?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (layerKey) {
      wrapper.dataset.layerName = layerKey;
    }

    const title = document.createElement('div');
    title.className = 'layer-title';
    title.textContent = layer?.protocol ? `${layer.name} · ${layer.protocol}` : (layer?.name ?? 'Capa');

    const details = document.createElement('p');
    details.className = 'layer-details';
    details.textContent = layer?.info ?? '';

    wrapper.append(title, details);
    dom.layerStack.appendChild(wrapper);
  });
}

function renderPacket(dom, step) {
  const packet = step?.packet;
  dom.packetDirection.textContent = packet?.direction ?? '';
  dom.packetFields.innerHTML = '';

  if (packet && Array.isArray(packet.fields)) {
    packet.fields.forEach((field) => {
      const dt = document.createElement('dt');
      dt.textContent = field.label ?? '';
      const dd = document.createElement('dd');
      dd.textContent = field.value ?? '';
      dom.packetFields.append(dt, dd);
    });
  }

  updateAdvancedButton(step, hasPacketFields(packet));
}

function renderEvents(dom, step) {
  dom.eventLog.innerHTML = '';
  if (step?.description) {
    const intro = document.createElement('li');
    intro.textContent = step.description;
    intro.classList.add('highlight');
    dom.eventLog.appendChild(intro);
  }

  if (Array.isArray(step?.events)) {
    step.events.forEach((event) => {
      const li = document.createElement('li');
      li.textContent = event;
      dom.eventLog.appendChild(li);
    });
  }
}

export function renderStep(dom, scenario, step) {
  if (!step) {
    dom.layerStack.innerHTML = '';
    dom.packetFields.innerHTML = '';
    dom.eventLog.innerHTML = '';
    dom.challengeSection.hidden = true;
    dom.challengeSection.innerHTML = '';
    return;
  }

  renderLayers(dom, step.layers);
  renderPacket(dom, step);
  renderEvents(dom, step);

  if (step.challenge) {
    dom.challengeSection.hidden = false;
    dom.challengeSection.innerHTML = '';
    renderChallenge(dom.challengeSection, scenario, step);
  } else {
    dom.challengeSection.hidden = true;
    dom.challengeSection.innerHTML = '';
  }
}
