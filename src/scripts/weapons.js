const weapons = [
    { id: 'bow', name: 'Bow', icon: './src/resources/bow_icon.webp' },
    { id: 'charge-blade', name: 'Charge Blade', icon: './src/resources/charge_blade_icon.webp' },
    { id: 'dual-blades', name: 'Dual Blades', icon: './src/resources/dual_blades_icon.webp' },
    { id: 'greatsword', name: 'Great Sword', icon: './src/resources/great_sword_icon_light.webp' },
    { id: 'gunlance', name: 'Gunlance', icon: './src/resources/gunlance_icon.webp' },
    { id: 'hammer', name: 'Hammer', icon: './src/resources/hammer_icon.webp' },
    { id: 'heavy-bowgun', name: 'Heavy Bowgun', icon: './src/resources/heavy_bowgun_icon.webp' },
    { id: 'hunting-horn', name: 'Hunting Horn', icon: './src/resources/hunting_horn_icon.webp' },
    { id: 'insect-glaive', name: 'Insect Glaive', icon: './src/resources/insect_glaive_icon.webp' },
    { id: 'lance', name: 'Lance', icon: './src/resources/lance_icon.webp' },
    { id: 'light-bowgun', name: 'Light Bowgun', icon: './src/resources/light_bowgun_icon.webp' },
    { id: 'long-sword', name: 'Long Sword', icon: './src/resources/long_sword_icon.webp' },
    { id: 'switch-axe', name: 'Switch Axe', icon: './src/resources/switch_axe_icon.webp' },
    { id: 'sword-and-shield', name: 'Sword & Shield', icon: './src/resources/sword_and_shield_icon.webp' }
];


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    
    const weaponButtonsContainer = document.getElementById('weapon-buttons');
    console.log("Container found:", weaponButtonsContainer);

    if (!weapons) {
        console.error("Weapons data not loaded!");
        return;
    }

    weapons.forEach(weapon => {
        console.log("Creating button for:", weapon.name);
        const button = document.createElement('button');
        button.className = 'weapon-btn';
        button.setAttribute('data-weapon-id', weapon.id);
        
        button.innerHTML = `
            <img src="${weapon.icon}" alt="${weapon.name}" onerror="console.error('Failed to load image: ${weapon.icon}')">
            <span>${weapon.name}</span>
        `;

        button.addEventListener('click', () => {
            // Remove selected class from all buttons
            document.querySelectorAll('.weapon-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Add selected class to clicked button
            button.classList.add('selected');
            // Dispatch a custom event instead of using global variable
            const event = new CustomEvent('weaponSelected', { detail: weapon });
            document.dispatchEvent(event);
        });

        weaponButtonsContainer.appendChild(button);
    });
});