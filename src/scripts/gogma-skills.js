// Gogma skill color configuration
export const GOGMA_COLORS = {
    red: { cssClass: 'gogma-red', background: '#ffcdd2', border: '#c62828' },
    yellow: { cssClass: 'gogma-yellow', background: '#ffecb3', border: '#ff8f00' },
    green: { cssClass: 'gogma-green', background: '#c8e6c9', border: '#2e7d32' }
};

// Group Skills (4 skills)
export const groupSkills = [
    { id: 'lords-soul', name: "Lord's Soul", color: 'red' },
    { id: 'lords-fury', name: "Lord's Fury", color: 'yellow' },
    { id: 'fortifying-pelt', name: "Fortifying Pelt", color: 'green' },
    { id: 'guardians-pulse', name: "Guardian's Pulse", color: 'green' }
];

// Set Bonus Skills (18 skills)
export const setBonusSkills = [
    // Red (9)
    { id: 'gore-magala', name: "Gore Magala's Tyranny", color: 'red' },
    { id: 'leviathan', name: "Leviathan's Fury", color: 'red' },
    { id: 'seregios', name: "Seregios's Tenacity", color: 'red' },
    { id: 'jin-dahaad', name: "Jin Dahaad's Revolt", color: 'red' },
    { id: 'fulgur-anjanath', name: "Fulgur Anjanath's Will", color: 'red' },
    { id: 'ebony-odogaron', name: "Ebony Odogaron's Power", color: 'red' },
    { id: 'omega-resonance', name: "Omega Resonance", color: 'red' },
    { id: 'dark-knight', name: "Soul of the Dark Knight", color: 'red' },
    { id: 'gogmapocalypse', name: "Gogmapocalypse", color: 'red' },
    // Yellow (6)
    { id: 'rey-dau', name: "Rey Dau's Voltage", color: 'yellow' },
    { id: 'nu-udra', name: "Nu Udra's Mutiny", color: 'yellow' },
    { id: 'guardian-arkveld', name: "Guardian Arkveld's Vitality", color: 'yellow' },
    { id: 'arkveld', name: "Arkveld's Hunger", color: 'yellow' },
    { id: 'zoh-shia', name: "Zoh Shia's Pulse", color: 'yellow' },
    { id: 'xu-wu', name: "Xu Wu's Vigor", color: 'yellow' },
    // Green (3)
    { id: 'uth-duna', name: "Uth Duna's Cover", color: 'green' },
    { id: 'doshaguma', name: "Doshaguma's Might", color: 'green' },
    { id: 'mizutsune', name: "Mizutsune's Prowess", color: 'green' }
];

// Helper to find any gogma skill by ID
export function getGogmaSkillById(id) {
    return groupSkills.find(s => s.id === id)
        || setBonusSkills.find(s => s.id === id)
        || null;
}

// Helper to determine which class a skill belongs to
export function getSkillClass(id) {
    if (groupSkills.find(s => s.id === id)) return 'group';
    if (setBonusSkills.find(s => s.id === id)) return 'setBonus';
    return null;
}
