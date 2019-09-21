import {assertNever} from './util'

export type Token =
  | {type: 'Action'; value: string}
  | {type: 'CloseAction'}
  | {type: 'OpenAction'}
  | {type: 'Text'; value: string}
  | {type: 'TrimCloseAction'}
  | {type: 'TrimOpenAction'}

enum State {
  /** Inside the body text document */
  InDocument,

  /** Inside the action expression */
  InActionExpression,

  /** Inside quotes in the action expression */
  InActionExpressionQuotes,
}

/**
 * Tokenize the input string using a finite state machine
 *
 * @param input the input text, containing Go template tags
 */
export function tokenize(input: string) {
  const inputLength = input.length
  const tokens: Token[] = []

  let state: State = State.InDocument
  let buffer = ''

  for (let idx = 0; idx < inputLength; idx++) {
    const char = input[idx]

    switch (state) {
      case State.InDocument: {
        if (char === '{' && input[idx + 1] === '{') {
          if (buffer.length) {
            tokens.push({type: 'Text', value: buffer})
            buffer = ''
          }

          if (input[idx + 2] === '-' && input[idx + 3] === ' ') {
            tokens.push({type: 'TrimOpenAction'})
            idx += 3
          } else {
            tokens.push({type: 'OpenAction'})
            idx += 1
          }
          state = State.InActionExpression
        } else {
          buffer += char
        }
        break
      }

      case State.InActionExpression: {
        if (char === ' ' && input[idx + 1] === '-' && input[idx + 2] === '}' && input[idx + 3] === '}') {
          tokens.push({type: 'Action', value: buffer})
          tokens.push({type: 'TrimCloseAction'})
          buffer = ''
          idx += 3
          state = State.InDocument
        } else if (char === '}' && input[idx + 1] === '}') {
          tokens.push({type: 'Action', value: buffer})
          tokens.push({type: 'CloseAction'})
          buffer = ''
          idx += 1
          state = State.InDocument
        } else if (char === '"') {
          buffer += char
          state = State.InActionExpressionQuotes
        } else {
          buffer += char
        }
        break
      }

      case State.InActionExpressionQuotes: {
        buffer += char
        if (char === '"' && input[idx - 1] !== '\\') {
          state = State.InActionExpression
        }
        break
      }

      default:
        assertNever(state)
    }
  }

  // Handle final state
  switch (state) {
    case State.InDocument: {
      if (buffer.length) {
        tokens.push({type: 'Text', value: buffer})
      }
      break
    }

    case State.InActionExpression:
    case State.InActionExpressionQuotes:
      throw new Error(`Invalid file, expected file end, got unknown token: ${State[state]}`)

    default:
      assertNever(state)
  }

  return tokens
}
