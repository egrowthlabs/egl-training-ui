/**
 * jest.setup.ts — re_line UI Test Setup
 * Extiende los matchers de Jest con los de @testing-library/jest-dom.
 * Esto permite usar aserciones como:
 *   expect(element).toBeInTheDocument()
 *   expect(element).toHaveTextContent('re_line')
 *   expect(button).toBeDisabled()
 */
import '@testing-library/jest-dom'
