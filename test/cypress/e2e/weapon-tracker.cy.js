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
    // Now we have 14 buttons (4 skills x 4 levels, minus 2 for sharpness which only has I and EX)
    cy.get('#attribute-buttons button').should('have.length', 14);
  });

  it('should select weapon and show attributes', () => {
    cy.get('[data-weapon-id="bow"]').click();
    cy.get('[data-weapon-id="bow"]').should('have.class', 'selected');
  });

  it('should require weapon selection before attributes', () => {
    cy.get('[data-attribute-id="attack-I"]').click();
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

    // Add 5 attributes (using level-based IDs)
    cy.get('[data-attribute-id="attack-I"]').click();
    cy.get('[data-attribute-id="affinity-I"]').click();
    cy.get('[data-attribute-id="element-I"]').click();
    cy.get('[data-attribute-id="sharpness-I"]').click();
    cy.get('[data-attribute-id="attack-II"]').click();  // Add attack II to reach 5

    // Verify attributes in first row
    cy.get('#rolls-body tr:first-child').within(() => {
      cy.get('td.attribute-cell').should('have.length', 5);
      cy.get('td.attribute-cell:nth-child(2) .attribute-content span').should('contain', 'Attack I');
      cy.get('td.attribute-cell:nth-child(3) .attribute-content span').should('contain', 'Affinity I');
      cy.get('td.attribute-cell:nth-child(4) .attribute-content span').should('contain', 'Element I');
      cy.get('td.attribute-cell:nth-child(5) .attribute-content span').should('contain', 'Sharpness I');
      cy.get('td.attribute-cell:nth-child(6) .attribute-content span').should('contain', 'Attack II');
    });
  });

  it('should allow changing an existing attribute', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();

    // Add 3 attributes
    cy.get('[data-attribute-id="attack-I"]').click();
    cy.get('[data-attribute-id="affinity-I"]').click();
    cy.get('[data-attribute-id="element-I"]').click();

    // Select 2nd attribute and change it
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(3)').click();
    cy.get('[data-attribute-id="sharpness-I"]').click();

    // Verify the change
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(3) .attribute-content span')
      .should('contain', 'Sharpness I');
  });

  it('should create new row after 5 attributes', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();

    // Add 6 attributes
    cy.get('[data-attribute-id="attack-I"]').click();
    cy.get('[data-attribute-id="affinity-I"]').click();
    cy.get('[data-attribute-id="element-I"]').click();
    cy.get('[data-attribute-id="sharpness-I"]').click();
    cy.get('[data-attribute-id="attack-II"]').click();
    cy.get('[data-attribute-id="affinity-II"]').click();  // 6th attribute

    // Verify we have 2 rows
    cy.get('#rolls-body tr').should('have.length', 2);

    // Verify second row has 1 attribute
    cy.get('#rolls-body tr:nth-child(2)').within(() => {
      cy.get('td.attribute-cell .attribute-content').should('have.length', 1);
      cy.get('td.attribute-cell:nth-child(2) .attribute-content span').should('contain', 'Affinity II');
    });
  });

  it('should maintain proper row order after deletion', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click();

    // Create 3 rows by adding attributes
    for (let i = 0; i < 3; i++) {
      cy.get('[data-attribute-id="attack-I"]').click();
      cy.get('[data-attribute-id="affinity-I"]').click();
      cy.get('[data-attribute-id="element-I"]').click();
      cy.get('[data-attribute-id="sharpness-I"]').click();
      cy.get('[data-attribute-id="attack-II"]').click();
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
