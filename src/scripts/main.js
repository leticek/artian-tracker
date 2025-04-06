let selectedWeapon = null;
let currentRoll = {
    number: 1,
    attributes: []
};
let selectedAttributeCell = null;

// Listen for weapon selection
document.addEventListener('weaponSelected', (event) => {
    console.log("Weapon selected:", event.detail);
    selectedWeapon = event.detail;
    loadWeaponRolls();
});

// Add this event listener after the weaponSelected listener
document.addEventListener('attributeSelected', (event) => {
    const attribute = event.detail;
    console.log("Attribute selected:", attribute);
    console.log("Current roll:", currentRoll);
    if (!selectedWeapon) {
        alert('Please select a weapon first');
        return;
    }

    // If a cell is selected, update it
    if (selectedAttributeCell) {
        selectedAttributeCell.textContent = attribute.id;
        selectedAttributeCell.classList.remove('selected');
        
        // Update in localStorage
        updateRollInStorage(
            parseInt(selectedAttributeCell.dataset.roll),
            parseInt(selectedAttributeCell.dataset.position),
            attribute.id
        );
        
        selectedAttributeCell = null;
        return;
    }

    // Otherwise handle as a new attribute
    if (currentRoll.attributes.length < 5) {
        currentRoll.attributes.push(attribute.id);
        
        if (currentRoll.attributes.length === 5) {
            saveRoll();
            currentRoll = {
                number: currentRoll.number + 1,
                attributes: []
            };
        }
        
        // Update the display with both saved rolls and current roll
        updateDisplay();
    }
});

// Add this new function to handle display updates
function updateDisplay() {
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    const tbody = document.getElementById('rolls-body');
    tbody.innerHTML = '';
    
    // Display saved rolls
    rolls.forEach(roll => {
        tbody.appendChild(createRollRow(roll));
    });
    
    // Display current incomplete roll if it has attributes
    if (currentRoll.attributes.length > 0) {
        tbody.appendChild(createRollRow(currentRoll));
    }
}

function loadWeaponRolls() {
    if (!selectedWeapon) return;
    
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    currentRoll = {
        number: (rolls.length > 0 ? rolls[rolls.length - 1].number + 1 : 1),
        attributes: []
    };
    
    updateDisplay();
}

function createRollRow(roll) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${roll.number}</td>
        ${Array(5).fill().map((_, i) => `
            <td class="attribute-cell" data-roll="${roll.number}" data-position="${i}">
                ${roll.attributes[i] || ''}
            </td>
        `).join('')}
    `;

    // Add click listeners to attribute cells
    row.querySelectorAll('.attribute-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            if (selectedAttributeCell) {
                selectedAttributeCell.classList.remove('selected');
            }
            cell.classList.add('selected');
            selectedAttributeCell = cell;
        });
    });

    return row;
}

function saveRoll() {
    if (!selectedWeapon) return;
    
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    rolls.push(currentRoll);
    localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
}

function updateRollInStorage(rollNumber, position, attribute) {
    if (!selectedWeapon) return;
    
    const rolls = JSON.parse(localStorage.getItem(selectedWeapon.id) || '[]');
    const roll = rolls.find(r => r.number === rollNumber);
    
    if (roll) {
        roll.attributes[position] = attribute;
        localStorage.setItem(selectedWeapon.id, JSON.stringify(rolls));
    }
}