export const mock1 = [
  { id: 'Chaos' },
  { id: 'Gaia', parentId: 'Chaos' },
  { id: 'Eros', parentId: 'Chaos' },
  { id: 'Erebus', parentId: 'Chaos' },
  { id: 'Tartarus', parentId: 'Chaos' },
  { id: 'Mountains', parentId: 'Gaia' },
  { id: 'Pontus', parentId: 'Gaia' },
  { id: 'Uranus', parentId: 'Gaia' },
]

export const mock2 = [
  { id: 'Chaos2' },
  { id: 'Gaia2', parentId: 'Chaos2' },
  { id: 'Eros2', parentId: 'Chaos2' },
  { id: 'Erebus2', parentId: 'Chaos2' },
  { id: 'Tartarus2', parentId: 'Chaos2' },
  { id: 'Mountains2', parentId: 'Gaia2' },
  { id: 'Pontus2', parentId: 'Eros2' },
  { id: 'Uranus2', parentId: 'Eros2' },
]

export const mock3 = [
  { id: 'Chaos3' },
  { id: 'Gaia3', parentId: 'Chaos3' },
  { id: 'Eros3', parentId: 'Chaos3' },
  { id: 'Erebus3', parentId: 'Chaos3' },
  { id: 'Tartarus3', parentId: 'Chaos3' },
  { id: 'Pontus3', parentId: 'Gaia3' },
  { id: 'Uranus7', parentId: 'Tartarus3' },
  { id: 'Uranus8', parentId: 'Tartarus3' },
  { id: 'Uranus9', parentId: 'Tartarus3' },
  { id: 'Pontus10', parentId: 'Tartarus3' },
  { id: 'Uranus11', parentId: 'Gaia3' },
  { id: 'Uranus12', parentId: 'Gaia3' },
  { id: 'Uranus13', parentId: 'Gaia3' },
  { id: 'Uranus14', parentId: 'Gaia3' },
]

const data = [mock1, mock2, mock3]

data.forEach((mock) => {
  mock.forEach((item) => (item.name = item.id))
})


const MOCK_LIST = [mock1, mock2, mock3];
let index = 0;

export function getMockOrgData() {
  index++
  index = index % 3
  return MOCK_LIST[index];
}
