// Modify the attributes declaration to export it
export const attributes = [
    { id: 'attack', name: 'Attack Boost', icon: './src/resources/attack_icon.png' },
    { id: 'affinity', name: 'Affinity Boost', icon: './src/resources/affinity_icon.png' },
    { id: 'element', name: 'Element Boost', icon: './src/resources/element_icon.png' },
    { id: 'sharpness', name: 'Sharpness Boost', icon: './src/resources/sharpness_icon.webp' },
];

document.addEventListener('DOMContentLoaded', () => {
    const attributeButtonsContainer = document.getElementById('attribute-buttons');

    attributes.forEach(attribute => {
        const button = document.createElement('button');
        button.className = 'attribute-btn';
        // Fix typo in attribute name
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

        attributeButtonsContainer.appendChild(button);
    });
});