describe('Weapon Roll Tracker', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads successfully', () => {
    cy.get('#weapon-buttons').should('exist')
    cy.get('#attribute-buttons').should('exist')
  })

  it('should load weapon buttons', () => {
    cy.get('#weapon-buttons button').should('have.length.greaterThan', 0);
  });

  it('should load attribute buttons', () => {
    cy.get('#attribute-buttons button').should('have.length', 4);
  });

  it('should select weapon and show attributes', () => {
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('[data-weapon-id="bow"]').should('have.class', 'selected');
  });

  it('should require weapon selection before attributes', () => {
    cy.get('[data-attribute-id="attack"]').click();
    cy.get('.attribute-btn.error').should('exist');
  });

  it('should allow deleting weapon data', () => {
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('#delete-weapon').click();
    cy.get('#delete-weapon').should('have.class', 'confirm');
    cy.get('#delete-weapon').click();
    cy.get('#rolls-body').should('be.empty');
  });

  it('should allow adding 5 attributes to a roll', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();
    
    // Add 5 attributes
    cy.get('[data-attribute-id="attack"]').click();
    cy.get('[data-attribute-id="affinity"]').click();
    cy.get('[data-attribute-id="element"]').click();
    cy.get('[data-attribute-id="sharpness"]').click();
    cy.get('[data-attribute-id="attack"]').click();  // Add attack again to reach 5
  
    // Verify attributes in first row
    cy.get('#rolls-body tr:first-child').within(() => {
      cy.get('td.attribute-cell').should('have.length', 5);
      cy.get('td.attribute-cell:nth-child(2) .attribute-content span').should('contain', 'Attack Boost');
      cy.get('td.attribute-cell:nth-child(3) .attribute-content span').should('contain', 'Affinity Boost');
      cy.get('td.attribute-cell:nth-child(4) .attribute-content span').should('contain', 'Element Boost');
      cy.get('td.attribute-cell:nth-child(5) .attribute-content span').should('contain', 'Sharpness Boost');
      cy.get('td.attribute-cell:nth-child(6) .attribute-content span').should('contain', 'Attack Boost');
    });
  });
  
  it('should allow changing an existing attribute', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();
    
    // Add 3 attributes
    cy.get('[data-attribute-id="attack"]').click();
    cy.get('[data-attribute-id="affinity"]').click();
    cy.get('[data-attribute-id="element"]').click();
  
    // Select 2nd attribute and change it
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(3)').click();
    cy.get('[data-attribute-id="sharpness"]').click();
  
    // Verify the change
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(3) .attribute-content span')
      .should('contain', 'Sharpness Boost');
  });
  
  it('should create new row after 5 attributes', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();
    
    // Add 6 attributes
    cy.get('[data-attribute-id="attack"]').click();
    cy.get('[data-attribute-id="affinity"]').click();
    cy.get('[data-attribute-id="element"]').click();
    cy.get('[data-attribute-id="sharpness"]').click();
    cy.get('[data-attribute-id="attack"]').click();
    cy.get('[data-attribute-id="affinity"]').click();  // 6th attribute
  
    // Verify we have 2 rows
    cy.get('#rolls-body tr').should('have.length', 2);
    
    // Verify second row has 1 attribute
    cy.get('#rolls-body tr:nth-child(2)').within(() => {
      cy.get('td.attribute-cell .attribute-content').should('have.length', 1);
      cy.get('td.attribute-cell:nth-child(2) .attribute-content span').should('contain', 'Affinity Boost');
    });
  });
  
  it('should maintain proper row order after deletion', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();
    
    // Create 3 rows by adding attributes
    for (let i = 0; i < 3; i++) {
      cy.get('[data-attribute-id="attack"]').click();
      cy.get('[data-attribute-id="affinity"]').click();
      cy.get('[data-attribute-id="element"]').click();
      cy.get('[data-attribute-id="sharpness"]').click();
      cy.get('[data-attribute-id="attack"]').click();
    }
  
    // Verify we have 3 rows
    cy.get('#rolls-body tr').should('have.length', 3);
  
    // Delete middle row
    cy.get('#rolls-body tr:nth-child(2) td.number-cell').click();  // Enter delete mode
    cy.get('#rolls-body tr:nth-child(2) td.number-cell.delete-mode').click();  // Confirm deletion
  
    // Verify row order
    cy.get('#rolls-body tr').should('have.length', 2);
    cy.get('#rolls-body tr:nth-child(1) td.number-cell').should('contain', '1');
    cy.get('#rolls-body tr:nth-child(2) td.number-cell').should('contain', '2');
  });
});