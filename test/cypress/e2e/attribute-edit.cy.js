describe('Attribute Editing', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearLocalStorage()
  })

  it('should allow clicking on attributes to enter edit mode', () => {
    // Select a weapon
    cy.get('[data-weapon-id="bow"]').click()
    
    // Add a couple of attributes
    cy.get('[data-attribute-id="attack"]').click()
    cy.get('[data-attribute-id="affinity"]').click()
    
    // Click on the first attribute to enter edit mode
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(2)').click()
    
    // Verify edit mode is active by checking if the cell has the 'selected' class instead of 'edit-mode'
    cy.get('#rolls-body tr:first-child td.attribute-cell.selected').should('exist')
  })

  it('should maintain proper state after multiple edits', () => {
    // Select weapon
    cy.get('[data-weapon-id="bow"]').click()
    
    // Add attributes
    cy.get('[data-attribute-id="attack"]').click()
    cy.get('[data-attribute-id="affinity"]').click()
    
    // Edit first attribute from attack to element
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(2)').click()
    cy.get('[data-attribute-id="element"]').click()
    
    // Edit second attribute from affinity to sharpness
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(3)').click()
    cy.get('[data-attribute-id="sharpness"]').click()
    
    // Verify changes are reflected in the UI
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(2) .attribute-content span')
      .should('contain', 'Element')
    cy.get('#rolls-body tr:first-child td.attribute-cell:nth-child(3) .attribute-content span')
      .should('contain', 'Sharpness')
    
    // Verify changes are saved in localStorage
    cy.window().then((win) => {
      const bowData = JSON.parse(win.localStorage.getItem('bow'))
      expect(bowData[0].attributes[0]).to.equal('element')
      expect(bowData[0].attributes[1]).to.equal('sharpness')
    })
  })
})
