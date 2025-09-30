import { state } from './state.js';

let dom = null;
let logFn = () => {};

export function initAdvanced(domRefs, { onModeChange, log } = {}) {
  dom = domRefs;
  logFn = typeof log === 'function' ? log : () => {};

  const { advancedToggle, viewPacket } = dom.controls;
  const { wrapper, close } = dom.modal;

  if (advancedToggle) {
    advancedToggle.addEventListener('change', (event) => {
      const enabled = Boolean(event.target.checked);
      toggleAdvancedMode(enabled);
      if (typeof onModeChange === 'function') {
        onModeChange(enabled);
      }
    });
  }

  if (viewPacket) {
    viewPacket.addEventListener('click', () => {
      if (!state.currentStepData) return;
      renderPacketModal(state.currentStepData);
      openPacketModal();
    });
  }

  if (close) {
    close.addEventListener('click', closePacketModal);
  }

  if (wrapper) {
    wrapper.addEventListener('click', (event) => {
      if (event.target === wrapper) {
        closePacketModal();
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dom.modal.wrapper && !dom.modal.wrapper.hasAttribute('hidden')) {
        closePacketModal();
      }
    });
  }
}

export function toggleAdvancedMode(enabled) {
  state.advancedMode = enabled;
  if (!enabled) {
    closePacketModal();
  }
  if (state.currentStepData) {
    updateAdvancedButton(state.currentStepData, hasPacketFields(state.currentStepData.packet));
  }
}

export function hasPacketFields(packet) {
  return Boolean(packet && Array.isArray(packet.fields) && packet.fields.length > 0);
}

export function updateAdvancedButton(step, hasFields) {
  if (!dom) return;
  const { viewPacket, advancedToggle } = dom.controls;
  if (!viewPacket) return;

  if (advancedToggle && advancedToggle.checked !== state.advancedMode) {
    advancedToggle.checked = state.advancedMode;
  }

  viewPacket.hidden = !(state.advancedMode && hasFields);
  viewPacket.dataset.stepId = step && step.id ? step.id : '';
}

function buildAdvancedPacketSections(step) {
  const packet = step && step.packet ? step.packet : {};
  const fields = Array.isArray(packet.fields) ? packet.fields : [];
  const headers = fields.map((field) => `${field.label || 'Campo'}: ${field.value || ''}`);
  const rawString = headers.join('\n');

  let hexDump = '';
  if (rawString.length > 0 && typeof TextEncoder !== 'undefined') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(rawString);
    hexDump = bytes
      .map((byte, index) => {
        const value = byte.toString(16).padStart(2, '0');
        if (index === 0) return value;
        if (index % 16 === 0) return `\n${value}`;
        if (index % 8 === 0) return `  ${value}`;
        return ` ${value}`;
      })
      .join('');
  }

  const stats = [];
  stats.push({ label: 'Campos', value: String(fields.length) });
  stats.push({ label: 'Dirección', value: packet.direction || 'N/D' });
  stats.push({ label: 'Texto', value: `${rawString.length} bytes` });
  if (step && Array.isArray(step.layers)) {
    stats.push({ label: 'Capas', value: String(step.layers.length) });
    const activeLayer = step.layers.find((layer) => layer && layer.active);
    if (activeLayer) {
      stats.push({
        label: 'Capa activa',
        value: `${activeLayer.name || 'N/D'} (${activeLayer.protocol || 'N/D'})`,
      });
    }
  }
  return { headers, hexDump, stats };
}

export function renderPacketModal(step) {
  if (!dom) return;
  const { wrapper, body, title } = dom.modal;
  if (!wrapper || !body) return;

  body.innerHTML = '';
  if (title) {
    const name = (step && step.title) || 'Paquete';
    title.textContent = `Detalles avanzados: ${name}`;
  }

  const data = buildAdvancedPacketSections(step);

  body.appendChild(buildHeaderSection(data.headers));
  body.appendChild(buildHexSection(data.hexDump));
  body.appendChild(buildStatsSection(data.stats));
  logFn({ type: 'advanced:open', stepId: step && step.id ? step.id : null });
}

function buildHeaderSection(headers) {
  const section = document.createElement('div');
  section.className = 'modal-section';
  const heading = document.createElement('h4');
  heading.textContent = 'Cabeceras';
  section.appendChild(heading);
  const list = document.createElement('ul');
  list.className = 'references-list';
  if (!headers.length) {
    const item = document.createElement('li');
    item.textContent = 'No hay cabeceras disponibles.';
    list.appendChild(item);
  } else {
    headers.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.appendChild(item);
    });
  }
  section.appendChild(list);
  return section;
}

function buildHexSection(hexDump) {
  const section = document.createElement('div');
  section.className = 'modal-section';
  const heading = document.createElement('h4');
  heading.textContent = 'Representación hexadecimal';
  section.appendChild(heading);
  const codeBlock = document.createElement('pre');
  codeBlock.className = 'code-block';
  codeBlock.textContent = hexDump || 'N/A';
  section.appendChild(codeBlock);
  return section;
}

function buildStatsSection(stats) {
  const section = document.createElement('div');
  section.className = 'modal-section';
  const heading = document.createElement('h4');
  heading.textContent = 'Estadísticas';
  section.appendChild(heading);
  const grid = document.createElement('div');
  grid.className = 'stat-grid';
  stats.forEach((stat) => {
    const card = document.createElement('div');
    card.className = 'stat-card';
    const value = document.createElement('div');
    value.className = 'stat-value';
    value.textContent = stat.value;
    const label = document.createElement('div');
    label.className = 'stat-label';
    label.textContent = stat.label;
    card.appendChild(value);
    card.appendChild(label);
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

export function openPacketModal() {
  if (!dom) return;
  const { wrapper } = dom.modal;
  if (!wrapper) return;
  wrapper.removeAttribute('hidden');
}

export function closePacketModal() {
  if (!dom) return;
  const { wrapper } = dom.modal;
  if (!wrapper) return;
  wrapper.setAttribute('hidden', '');
}
