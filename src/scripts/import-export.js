import { migrateAttributeId } from './attributes.js';

// Migrate imported data to current format with levels
function migrateImportedData(data) {
    const result = {};

    Object.keys(data).forEach(weaponId => {
        const weaponData = data[weaponId];

        // Already v3 format (has artian/gogma)
        if (weaponData && typeof weaponData === 'object' && weaponData.artian !== undefined) {
            result[weaponId] = {
                artian: weaponData.artian.map(roll => ({
                    ...roll,
                    attributes: roll.attributes.map(attr => migrateAttributeId(attr))
                })),
                gogma: weaponData.gogma || []
            };
        }
        // v1/v2 flat array format
        else if (Array.isArray(weaponData)) {
            result[weaponId] = {
                artian: weaponData.map(roll => ({
                    ...roll,
                    attributes: roll.attributes.map(attr => migrateAttributeId(attr))
                })),
                gogma: []
            };
        }
    });

    return result;
}

// Validate v3 weapon data structure
function validateWeaponData(weaponData) {
    if (!weaponData || typeof weaponData !== 'object') return false;
    if (!Array.isArray(weaponData.artian)) return false;
    if (!Array.isArray(weaponData.gogma)) return false;

    for (const roll of weaponData.artian) {
        if (typeof roll !== 'object') return false;
        if (typeof roll.number !== 'number') return false;
        if (!Array.isArray(roll.attributes)) return false;
    }

    for (const roll of weaponData.gogma) {
        if (typeof roll !== 'object') return false;
        if (typeof roll.number !== 'number') return false;
    }

    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const importButton = document.getElementById('import-button');
    const exportButton = document.getElementById('export-button');
    const copyButton = document.getElementById('copy-button');
    const downloadButton = document.getElementById('download-button');
    const importData = document.getElementById('import-data');
    const exportData = document.getElementById('export-data');
    const importMessage = document.getElementById('import-message');
    const exportOutputContainer = document.querySelector('.export-output-container');

    if (importButton) {
        importButton.addEventListener('click', handleImport);
    }

    if (exportButton) {
        exportButton.addEventListener('click', handleExport);
    }

    if (copyButton) {
        copyButton.addEventListener('click', copyToClipboard);
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', downloadAsJson);
    }

    function handleImport() {
        try {
            let dataToImport = JSON.parse(importData.value);

            if (!dataToImport || typeof dataToImport !== 'object') {
                showImportMessage('Invalid JSON data format. Please check your input.', 'error');
                return;
            }

            // Migrate imported data to current format with levels (converts to v3)
            dataToImport = migrateImportedData(dataToImport);

            let importedCount = 0;
            let skippedCount = 0;
            let importedWeapons = []; // Keep track of successfully imported weapons

            Object.keys(dataToImport).forEach(weaponId => {
                // Get the weapon data to be imported
                const weaponData = dataToImport[weaponId];

                try {
                    // Validate v3 data structure before importing
                    if (!validateWeaponData(weaponData)) {
                        throw new Error('Invalid weapon data structure');
                    }

                    // Check if weapon already has meaningful data (v3 format with artian OR gogma data)
                    const existingData = localStorage.getItem(weaponId);
                    if (existingData) {
                        try {
                            const parsedData = JSON.parse(existingData);
                            // Skip if there's actual data in either artian or gogma arrays
                            if (parsedData && typeof parsedData === 'object' && parsedData.artian !== undefined) {
                                // v3 format: check if artian has attributes or gogma has data
                                const hasArtianData = Array.isArray(parsedData.artian) && parsedData.artian.some(roll => roll.attributes && roll.attributes.length > 0);
                                const hasGogmaData = Array.isArray(parsedData.gogma) && parsedData.gogma.length > 0;
                                if (hasArtianData || hasGogmaData) {
                                    skippedCount++;
                                    return;
                                }
                            } else if (Array.isArray(parsedData) && parsedData.some(roll => roll.attributes && roll.attributes.length > 0)) {
                                // Legacy format: skip if there's actual attribute data
                                skippedCount++;
                                return;
                            }
                        } catch (e) {
                            // If parsing fails, treat as if no data exists
                            console.warn(`Failed to parse existing data for ${weaponId}, will overwrite.`, e);
                        }
                    }

                    // Data is valid, save it in v3 format
                    localStorage.setItem(weaponId, JSON.stringify(weaponData));
                    importedCount++;
                    importedWeapons.push(weaponId); // Add to successful imports list
                } catch (validationError) {
                    console.error(`Invalid data for weapon ${weaponId}:`, validationError);
                    skippedCount++;
                }
            });

            if (importedCount > 0) {
                const successMessage = `Successfully imported data for ${importedCount} weapon(s)` +
                                      (skippedCount > 0 ? `, skipped ${skippedCount} weapon(s) that already had data.` : '.');
                showImportMessage(successMessage, 'success');
                importData.value = ''; // Clear the input

                // Custom event to notify the app of new data
                document.dispatchEvent(new CustomEvent('dataImported', {
                    detail: { importedWeapons }
                }));
            } else if (skippedCount > 0) {
                showImportMessage(`No data was imported. ${skippedCount} weapon(s) were skipped because they already had data.`, 'error');
            } else {
                showImportMessage('No valid weapon data found to import.', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showImportMessage('Failed to parse the JSON data. Please check your input format.', 'error');
        }
    }

    function handleExport() {
        // Generate export data from localStorage
        const exportObj = {};

        // Iterate through localStorage to collect all weapon data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                const value = JSON.parse(localStorage.getItem(key));

                // Only include v3 format weapon data (has artian property)
                if (value && typeof value === 'object' && value.artian !== undefined) {
                    const artian = value.artian || [];
                    const gogma = value.gogma || [];
                    // Check if there's any data to export
                    const hasData = artian.length > 0 || gogma.length > 0;
                    if (hasData) {
                        exportObj[key] = value;
                    }
                }
            } catch (e) {
                // Skip any non-JSON values
                console.log(`Skipping non-JSON item: ${key}`);
            }
        }

        // Format the JSON nicely
        exportData.value = JSON.stringify(exportObj, null, 2);
        exportOutputContainer.style.display = 'block';
    }

    function copyToClipboard() {
        exportData.select();
        document.execCommand('copy');
        
        // Visual feedback
        copyButton.classList.add('copied');
        copyButton.textContent = 'Copied!';
        
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.textContent = 'Copy to Clipboard';
        }, 2000);
    }

    function downloadAsJson() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData.value);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "weapon-rolls-export.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    function showImportMessage(message, type) {
        importMessage.textContent = message;
        importMessage.className = `message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                importMessage.className = 'message';
            }, 5000);
        }
    }
});
