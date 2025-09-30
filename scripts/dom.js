export function getDomRefs() {
  return {
    timelineList: document.getElementById('timeline-list'),
    scenarioTitle: document.getElementById('scenario-title'),
    layerStack: document.getElementById('layer-stack'),
    packetDirection: document.getElementById('packet-direction'),
    packetFields: document.getElementById('packet-fields'),
    eventLog: document.getElementById('event-log'),
    challengeSection: document.getElementById('challenge'),
    scenarioSelect: document.getElementById('scenario-select'),
    glossaryPanel: document.getElementById('glossary-panel'),
    glossaryList: document.getElementById('glossary-list'),
    referencesPanel: document.getElementById('references-panel'),
    referencesList: document.getElementById('references-list'),
    controls: {
      back: document.getElementById('step-back'),
      forward: document.getElementById('step-forward'),
      play: document.getElementById('play'),
      pause: document.getElementById('pause'),
      reset: document.getElementById('reset'),
      speedSlider: document.getElementById('speed'),
      speedLabel: document.getElementById('speed-label'),
      advancedToggle: document.getElementById('advanced-mode'),
      viewPacket: document.getElementById('packet-advanced'),
    },
    modal: {
      wrapper: document.getElementById('packet-modal'),
      body: document.getElementById('modal-body'),
      close: document.getElementById('modal-close'),
      title: document.getElementById('modal-title'),
    },
  };
}
