import {Token} from './lexer'
import {assertNever} from './util'

interface Context {
  variables: Map<string, unknown>
}

export function render(tokens: Token[]): string {
  let rendered = ''

  const context: Context = {
    variables: new Map(),
  }

  for (let idx = 0; idx < tokens.length; idx += 1) {
    const token = tokens[idx]

    switch (token.type) {
      case 'Assignment': {
        const lastToken = tokens[idx - 1]
        if (lastToken && lastToken.type === 'Variable') {
          context.variables.set(lastToken.name, tokens[idx + 1])
        }
        break
      }
      case 'CloseAction':
        break
      case 'Float':
        break
      case 'Function':
        break
      case 'GroupClose':
        break
      case 'GroupOpen':
        break
      case 'Integer':
        break
      case 'OpenAction':
        break
      case 'Pipe':
        break
      case 'PropertyAccess':
        break
      case 'String':
        break
      case 'Text':
        break
      case 'TrimCloseAction':
        break
      case 'TrimOpenAction':
        break
      case 'Variable':
        break

      default:
        assertNever(token)
    }
  }

  return rendered
}
