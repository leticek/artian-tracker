// Gogma Data - Constants for Gogmazios Artian weapons
(function() {
  const focusTypes = [
    { id: 'attack', name: 'Attack Focus', color: '#ff6b6b' },
    { id: 'affinity', name: 'Affinity Focus', color: '#4dabf7' },
    { id: 'element', name: 'Element Focus', color: '#51cf66' }
  ];

  const reinforcementTiers = ['I', 'II', 'III', 'EX'];

  const tierValues = {
    attack:    { I: 5,  II: 6,  III: 9,  EX: 12 },
    affinity:  { I: 5,  II: 6,  III: 8,  EX: 10 },
    sharpness: { I: 30, II: null, III: null, EX: 50 },
    element:   { I: 50, II: 60, III: 70, EX: 90 },
    ammo:      { I: 1,  II: null, III: null, EX: 2 }
  };

  const setBonusSkills = [
    "Gore Magala's Tyranny",
    "Leviathan's Fury",
    "Seregios's Tenacity",
    "Jin Dahaad's Revolt",
    "Omega Resonance"
  ];

  const groupSkills = [
    "Lord's Soul",
    "Guts",
    "Fortify",
    "Peak Performance"
  ];

  // Expose to global namespace
  window.GogmaData = {
    focusTypes,
    reinforcementTiers,
    tierValues,
    setBonusSkills,
    groupSkills
  };
})();
