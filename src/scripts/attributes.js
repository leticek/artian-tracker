// Skill level configuration
export const LEVELS = {
    I: { order: 1, label: 'I', cssClass: 'level-I' },
    II: { order: 2, label: 'II', cssClass: 'level-II' },
    III: { order: 3, label: 'III', cssClass: 'level-III' },
    EX: { order: 4, label: 'EX', cssClass: 'level-EX' }
};

// Base skills with their available levels
export const baseSkills = [
    {
        id: 'attack',
        name: 'Attack',
        icon: './src/resources/attack_icon.png',
        levels: ['I', 'II', 'III', 'EX']
    },
    {
        id: 'affinity',
        name: 'Affinity',
        icon: './src/resources/affinity_icon.png',
        levels: ['I', 'II', 'III', 'EX']
    },
    {
        id: 'element',
        name: 'Element',
        icon: './src/resources/element_icon.png',
        levels: ['I', 'II', 'III', 'EX']
    },
    {
        id: 'sharpness',
        name: 'Sharpness',
        icon: './src/resources/sharpness_icon.webp',
        levels: ['I', 'EX']  // Special case: only I and EX
    },
];

// Generate expanded attributes array from base skills
function generateAttributes(skills) {
    const result = [];
    skills.forEach(skill => {
        skill.levels.forEach(level => {
            result.push({
                id: `${skill.id}-${level}`,
                baseId: skill.id,
                level: level,
                name: `${skill.name} ${level}`,
                icon: skill.icon,
                cssClass: LEVELS[level].cssClass
            });
        });
    });
    return result;
}

export const attributes = generateAttributes(baseSkills);

// Helper to parse attribute ID into base and level
// Handles both new format ("attack-I") and legacy format ("attack")
export function parseAttributeId(id) {
    const match = id.match(/^(.+)-(I{1,3}|EX)$/);
    if (match) {
        return { baseId: match[1], level: match[2] };
    }
    // Legacy format - assume level I
    return { baseId: id, level: 'I' };
}

// Migrate legacy attribute ID to new format
export function migrateAttributeId(id) {
    if (id.match(/^(.+)-(I{1,3}|EX)$/)) {
        return id; // Already in new format
    }
    return `${id}-I`; // Convert to level I
}

document.addEventListener('DOMContentLoaded', () => {
    const attributeButtonsContainer = document.getElementById('attribute-buttons');
    if (!attributeButtonsContainer) return;

    // Create grouped button layout
    baseSkills.forEach(skill => {
        const group = document.createElement('div');
        group.className = 'attribute-group';

        // Create buttons for each level
        skill.levels.forEach(level => {
            const attribute = attributes.find(a => a.baseId === skill.id && a.level === level);
            if (!attribute) return;

            const button = document.createElement('button');
            button.className = `attribute-btn ${attribute.cssClass}`;
            button.setAttribute('data-attribute-id', attribute.id);

            button.innerHTML = `
                <img src="${attribute.icon}" alt="${attribute.name}" onerror="console.error('Failed to load image: ${attribute.icon}')">
                <span>${attribute.name}</span>
            `;

            button.addEventListener('click', () => {
                // Remove selected class from all buttons
                document.querySelectorAll('.attribute-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });

                // Add selected class to clicked button
                button.classList.add('selected');

                // Dispatch attribute selection event
                const event = new CustomEvent('attributeSelected', {
                    detail: attribute
                });
                document.dispatchEvent(event);
            });

            group.appendChild(button);
        });

        attributeButtonsContainer.appendChild(group);
    });
});
