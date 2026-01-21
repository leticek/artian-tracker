// Gogma Main - Mode management and UI helpers
(function() {
  // Access data from global namespace
  var GogmaData = window.GogmaData;
  var focusTypes = GogmaData.focusTypes;
  var reinforcementTiers = GogmaData.reinforcementTiers;
  var setBonusSkills = GogmaData.setBonusSkills;
  var groupSkills = GogmaData.groupSkills;

  var gogmaMode = false;

  function isGogmaMode() {
    return gogmaMode;
  }

  function setGogmaMode(enabled) {
    gogmaMode = enabled;
    localStorage.setItem('tracker-mode', enabled ? 'gogma' : 'standard');
  }

  function loadSavedMode() {
    var savedMode = localStorage.getItem('tracker-mode');
    gogmaMode = savedMode === 'gogma';
    return gogmaMode;
  }

  function getStorageKey(weaponId) {
    return gogmaMode ? 'gogma-' + weaponId : weaponId;
  }

  function initGogmaConfig(weaponId) {
    var key = 'gogma-' + weaponId;
    var existing = localStorage.getItem(key);

    if (existing) {
      try {
        return JSON.parse(existing);
      } catch (e) {
        console.error('Failed to parse gogma config:', e);
      }
    }

    return {
      focusType: null,
      setBonusSkill: null,
      groupSkill: null,
      rolls: []
    };
  }

  function saveGogmaConfig(weaponId, config) {
    var key = 'gogma-' + weaponId;
    localStorage.setItem(key, JSON.stringify(config));
  }

  function createGogmaRoll(rollNumber) {
    return {
      number: rollNumber,
      attributes: [] // Will contain { id: string, tier: string }
    };
  }

  function addAttributeToGogmaRoll(roll, attributeId, tier) {
    tier = tier || 'I';
    if (roll.attributes.length < 5) {
      roll.attributes.push({ id: attributeId, tier: tier });
    }
    return roll;
  }

  function updateGogmaTier(weaponId, rollNumber, position, newTier) {
    var config = initGogmaConfig(weaponId);
    var roll = config.rolls.find(function(r) { return r.number === rollNumber; });

    if (roll && roll.attributes[position]) {
      roll.attributes[position].tier = newTier;
      saveGogmaConfig(weaponId, config);
    }
  }

  function populateFocusButtons(container, selectedFocus, onSelect) {
    container.innerHTML = '';

    focusTypes.forEach(function(focus) {
      var btn = document.createElement('button');
      btn.className = 'focus-btn' + (selectedFocus === focus.id ? ' selected' : '');
      btn.setAttribute('data-focus', focus.id);
      btn.textContent = focus.name;
      btn.addEventListener('click', function() { onSelect(focus.id); });
      container.appendChild(btn);
    });
  }

  function populateSkillDropdowns(setBonusSelect, groupSelect, config, onUpdate) {
    // Clone and replace to remove old event listeners
    var newSetBonusSelect = setBonusSelect.cloneNode(false);
    var newGroupSelect = groupSelect.cloneNode(false);

    // Populate Set Bonus Skills
    newSetBonusSelect.innerHTML = '<option value="">-- Select --</option>';
    setBonusSkills.forEach(function(skill) {
      var option = document.createElement('option');
      option.value = skill;
      option.textContent = skill;
      if (config.setBonusSkill === skill) {
        option.selected = true;
      }
      newSetBonusSelect.appendChild(option);
    });

    // Populate Group Skills
    newGroupSelect.innerHTML = '<option value="">-- Select --</option>';
    groupSkills.forEach(function(skill) {
      var option = document.createElement('option');
      option.value = skill;
      option.textContent = skill;
      if (config.groupSkill === skill) {
        option.selected = true;
      }
      newGroupSelect.appendChild(option);
    });

    // Add change listeners
    newSetBonusSelect.addEventListener('change', function(e) {
      onUpdate('setBonusSkill', e.target.value || null);
    });

    newGroupSelect.addEventListener('change', function(e) {
      onUpdate('groupSkill', e.target.value || null);
    });

    // Replace old elements with new ones
    setBonusSelect.parentNode.replaceChild(newSetBonusSelect, setBonusSelect);
    groupSelect.parentNode.replaceChild(newGroupSelect, groupSelect);
  }

  // Expose to global namespace
  window.GogmaMain = {
    isGogmaMode: isGogmaMode,
    setGogmaMode: setGogmaMode,
    loadSavedMode: loadSavedMode,
    getStorageKey: getStorageKey,
    initGogmaConfig: initGogmaConfig,
    saveGogmaConfig: saveGogmaConfig,
    createGogmaRoll: createGogmaRoll,
    addAttributeToGogmaRoll: addAttributeToGogmaRoll,
    updateGogmaTier: updateGogmaTier,
    populateFocusButtons: populateFocusButtons,
    populateSkillDropdowns: populateSkillDropdowns,
    reinforcementTiers: reinforcementTiers
  };
})();
