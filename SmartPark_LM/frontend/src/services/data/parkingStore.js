// Shared parking layout store (simple module-level state so all pages share it)
// Floor → array of placed elements

const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

// Default initial floors
const defaultFloors = [
  { id: 'floor-1', name: 'Floor 1', visible: true, slots: 0 },
  { id: 'floor-2', name: 'Floor 2', visible: true, slots: 0 },
  { id: 'floor-3', name: 'Floor 3', visible: false, slots: 0 },
]

let store = {
  floors: defaultFloors,
  // elements per floorId: { [floorId]: Element[] }
  elements: {},
  // saved version (what Parking page sees)
  savedFloors: defaultFloors,
  savedElements: {},
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getStore() {
  return store
}

export function setDraft(floors, elements) {
  store = { ...store, floors, elements }
  notify()
}

export function saveLayout(floors, elements) {
  store = { ...store, floors, elements, savedFloors: floors, savedElements: elements }
  notify()
}

export function getSaved() {
  return { floors: store.savedFloors, elements: store.savedElements }
}

