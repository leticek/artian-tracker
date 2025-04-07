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

    // Import valid data
    const validData = {
      'bow': [{ number: 1, attributes: ['attack', 'affinity'] }]
    }
    cy.get('#import-data').type(JSON.stringify(validData), { parseSpecialCharSequences: false })
    cy.get('#import-button').click()
    
    // Check for success message
    cy.get('#import-message')
      .should('have.class', 'success')
      .and('contain.text', 'Successfully imported')

    // Verify localStorage now has the data
    cy.window().then((win) => {
      expect(win.localStorage.getItem('bow')).to.eq(JSON.stringify(validData.bow))
    })
  })

  it('should not overwrite existing weapon data on import', () => {
    // Setup initial data
    cy.window().then((win) => {
      win.localStorage.setItem('bow', JSON.stringify([{ number: 1, attributes: ['attack'] }]))
    })

    // Try to import data for the same weapon
    const importData = {
      'bow': [{ number: 1, attributes: ['element', 'sharpness'] }]
    }
    cy.get('#import-data').type(JSON.stringify(importData), { parseSpecialCharSequences: false })
    cy.get('#import-button').click()

    // Check for warning message
    cy.get('#import-message')
      .should('have.class', 'error')
      .and('contain.text', 'skipped')

    // Verify original data was preserved
    cy.window().then((win) => {
      expect(win.localStorage.getItem('bow')).to.eq(JSON.stringify([{ number: 1, attributes: ['attack'] }]))
    })
  })

  it('should export localStorage data when export button is clicked', () => {
    // Setup data to export
    cy.window().then((win) => {
      win.localStorage.setItem('bow', JSON.stringify([{ number: 1, attributes: ['attack'] }]))
      win.localStorage.setItem('sword', JSON.stringify([{ number: 1, attributes: ['element'] }]))
    })

    // Click export button
    cy.get('#export-button').click()

    // Check that export container is visible
    cy.get('.export-output-container').should('be.visible')

    // Verify exported data contains both weapons
    cy.get('#export-data').then($textarea => {
      const exportedData = JSON.parse($textarea.val())
      expect(exportedData).to.have.property('bow')
      expect(exportedData).to.have.property('sword')
      expect(exportedData.bow[0].attributes[0]).to.eq('attack')
      expect(exportedData.sword[0].attributes[0]).to.eq('element')
    })
  })

  it('should immediately update selected weapon display after import', () => {
    // Select a weapon
    cy.get('[data-weapon-id="bow"]').click()
    
    // Import data for the selected weapon (assuming localStorage is empty)
    const importData = {
      'bow': [{ number: 1, attributes: ['attack', 'affinity', 'element'] }]
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
    
    // Prepare import data with multiple attributes
    const importData = {
      'bow': [{ number: 1, attributes: ['attack', 'affinity', 'element', 'sharpness', 'attack'] }]
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
    
    // Clear localStorage and set empty array
    cy.window().then((win) => {
      win.localStorage.setItem('bow', '[]');
    });
    
    // Import data for bow
    const importData = {
      'bow': [{ number: 1, attributes: ['attack', 'affinity'] }]
    };
    
    cy.get('#import-data').type(JSON.stringify(importData), { parseSpecialCharSequences: false });
    cy.get('#import-button').click();
    
    // Check for success message
    cy.get('#import-message')
      .should('have.class', 'success')
      .and('contain.text', 'Successfully imported');
      
    // Verify data was imported
    cy.window().then((win) => {
      const storedData = JSON.parse(win.localStorage.getItem('bow'));
      expect(storedData).to.deep.equal(importData.bow);
    });
    
    // Verify UI shows imported attributes
    cy.get('#rolls-body tr').should('have.length', 1);
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(0).should('contain', 'Attack');
    cy.get('#rolls-body tr:first-child td.attribute-cell').eq(1).should('contain', 'Affinity');
  });
})
