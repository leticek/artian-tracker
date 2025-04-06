const attributes = [
    { id: 'attack', name: 'Attack Boost', icon: './resources/bow_icon.webp' },
    { id: 'affinity', name: 'Affinity Boost', icon: '' },
    { id: 'elemental', name: 'Elemental Boost', icon: '' },
    { id: 'sharpness', name: 'Sharpness Boost', icon: './resources/sharpness_icon.webp' },
];


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    
    const attributeButtonsContainer = document.getElementById('attribute-buttons');
    console.log("Container found:", attributeButtonsContainer);

    attributes.forEach(attribute => {
        console.log("Creating button for:", attribute.name);
        const button = document.createElement('button');
        button.className = 'attribute-btn';
        button.setAttribute('data-attributr-id', attribute.id);
        
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
            selectedAttribute = attribute;
        });

        attributeButtonsContainer.appendChild(button);
    });
});