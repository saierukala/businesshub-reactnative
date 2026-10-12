// An icon for each appliance type in the catalog (by name); anything new falls back to a wrench.
const BY_CATEGORY: Record<string, string> = {
  'Washing Machine': 'washing-machine',
  Refrigerator: 'fridge-outline',
  'Air Conditioner': 'air-conditioner',
  Microwave: 'microwave',
  Dishwasher: 'dishwasher',
  'Water Purifier': 'water-outline',
  TV: 'television',
};

export const categoryIcon = (name?: string) => (name && BY_CATEGORY[name]) || 'wrench-outline';
