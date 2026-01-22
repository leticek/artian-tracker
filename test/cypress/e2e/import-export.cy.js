describe('Import/Export Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
  })

  it('should have import and export sections', () => {
    cy.get('.import-container').should('exist')
    cy.get('.export-container').should('exist')
    cy.get('#import-data').should('exist')
    cy.get('#import-button').should('exist')
    cy.get('#export-button').should('exist')
  })

  it('should show error when importing invalid JSON', () => {
    cy.get('#import-data').type('{ invalid json }', { parseSpecialCharSequences: false })
    cy.get('#import-button').click()
    cy.get('#import-message')
      .should('have.class', 'error')
      .and('contain.text', 'Failed to parse')
  })

  it('should import valid weapon data', () => {
    // First, verify localStorage is empty
    cy.window().then((win) => {
      expect(win.localStorage.length).to.eq(0)
    })

    // Import valid data (v3 format or legacy format - both should work)
    const validData = {
      'bow': [{ number: 1, attributes: ['attack-I', 'affinity-I'] }]
    }
    cy.get('#import-data').type(JSON.stringify(validData), { parseSpecialCharSequences: false })
    cy.get('#import-button').click()

    // Check for success message
    cy.get('#import-message')
      .should('have.class', 'success')
      .and('contain.text', 'Successfully imported')

    // Verify localStorage now has the data in v3 format
    cy.window().then((win) => {
      const storedData = JSON.parse(win.localStorage.getItem('bow'))
      expect(storedData.artian[0].attributes).to.deep.equal(['attack-I', 'affinity-I'])
    })
  })

  it('should not overwrite existing weapon data on import', () => {
    // Setup initial data in v3 format
    cy.window().then((win) => {
      win.localStorage.setItem('bow', JSON.stringify({
        artian: [{ number: 1, attributes: ['attack-I'] }],
        gogma: []
      }))
    })

    // Try to import data for the same weapon
    const importData = {
      'bow': [{ number: 1, attributes: ['element-I', 'sharpness-I'] }]
    }
    cy.get('#import-data').type(JSON.stringify(importData), { parseSpecialCharSequences: false })
    cy.get('#import-button').click()

    // Check for warning message
    cy.get('#import-message')
      .should('have.class', 'error')
      .and('contain.text', 'skipped')

    // Verify original data was preserved
    cy.window().then((win) => {
      const storedData = JSON.parse(win.localStorage.getItem('bow'))
      expect(storedData.artian[0].attributes[0]).to.equal('attack-I')
    })
  })

  it('should export localStorage data when export button is clicked', () => {
    // Setup data to export in v3 format
    cy.window().then((win) => {
      win.localStorage.setItem('bow', JSON.stringify({
        artian: [{ number: 1, attributes: ['attack-I'] }],
        gogma: []
      }))
      win.localStorage.setItem('sword', JSON.stringify({
        artian: [{ number: 1, attributes: ['element-I'] }],
        gogma: []
      }))
    })

    // Click export button
    cy.get('#export-button').click()

    // Check that export container is visible
    cy.get('.export-output-container').should('be.visible')

    // Verify exported data contains both weapons in v3 format
    cy.get('#export-data').then($textarea => {
      const exportedData = JSON.parse($textarea.val())
      expect(exportedData).to.have.property('bow')
      expect(exportedData).to.have.property('sword')
      expect(exportedData.bow.artian[0].attributes[0]).to.eq('attack-I')
      expect(exportedData.sword.artian[0].attributes[0]).to.eq('element-I')
    })
  })

  it('should immediately update selected weapon display after import', () => {
    // Select a weapon
    cy.get('[data-weapon-id="bow"]').click()

    // Import data for the selected weapon (legacy format - will be migrated)
    const importData = {
      'bow': [{ number: 1, attributes: ['attack-I', 'affinity-I', 'element-I'] }]
    }

    cy.get('#import-data').type(JSON.stringify(importData), { parseSpecialCharSequences: false })
    cy.get('#import-button').click()

    // Verify the UI shows the imported attributes for the selected weapon
    cy.get('#rolls-body tr').should('have.length', 1)
    cy.get('#rolls-body tr:first td.attribute-cell').eq(0).should('contain', 'Attack')
    cy.get('#rolls-body tr:first td.attribute-cell').eq(1).should('contain', 'Affinity')
    cy.get('#rolls-body tr:first td.attribute-cell').eq(2).should('contain', 'Element')
  })

  it('should immediately update UI when importing data for the selected weapon', () => {
    // Select a weapon first
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('[data-weapon-id="bow"]').should('have.class', 'selected');

    // Prepare import data with multiple attributes (legacy format)
    const importData = {
      'bow': [{ number: 1, attributes: ['attack-I', 'affinity-I', 'element-I', 'sharpness-I', 'attack-II'] }]
    };

    // Import the data
    cy.get('#import-data').type(JSON.stringify(importData), { parseSpecialCharSequences: false });
    cy.get('#import-button').click();

    // Check that the table is updated with the imported data (all 5 attributes)
    cy.get('#rolls-body tr').should('have.length', 1);
    cy.get('#rolls-body tr:first-child td.attribute-cell').should('have.length', 5);
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(0).should('contain', 'Attack');
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(1).should('contain', 'Affinity');
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(2).should('contain', 'Element');
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(3).should('contain', 'Sharpness');
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(4).should('contain', 'Attack');
  });

  it('should keep weapon selection after deleting all data', () => {
    // Select a weapon
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('[data-weapon-id="bow"]').should('have.class', 'selected');

    // Delete all data
    cy.get('#delete-all').click();
    cy.get('#delete-all').should('have.class', 'confirm');
    cy.get('#delete-all').click();

    // Verify weapon is still selected
    cy.get('[data-weapon-id="bow"]').should('have.class', 'selected');

    // Verify table is empty (data was cleared)
    cy.get('#rolls-body').should('be.empty');
  });

  it('should import data if weapon has empty array in localStorage', () => {
    // First select a weapon to create empty array in localStorage
    cy.get('[data-weapon-id="bow"]').click();

    // Clear localStorage and set empty v3 format
    cy.window().then((win) => {
      win.localStorage.setItem('bow', JSON.stringify({ artian: [], gogma: [] }));
    });

    // Import data for bow (legacy format - will be migrated)
    const importData = {
      'bow': [{ number: 1, attributes: ['attack-I', 'affinity-I'] }]
    };

    cy.get('#import-data').type(JSON.stringify(importData), { parseSpecialCharSequences: false });
    cy.get('#import-button').click();

    // Check for success message
    cy.get('#import-message')
      .should('have.class', 'success')
      .and('contain.text', 'Successfully imported');

    // Verify data was imported in v3 format
    cy.window().then((win) => {
      const storedData = JSON.parse(win.localStorage.getItem('bow'));
      expect(storedData.artian[0].attributes).to.deep.equal(['attack-I', 'affinity-I']);
    });

    // Verify UI shows imported attributes
    cy.get('#rolls-body tr').should('have.length', 1);
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(0).should('contain', 'Attack');
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(1).should('contain', 'Affinity');
  });
})
