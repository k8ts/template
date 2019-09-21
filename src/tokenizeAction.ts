import {assertNever} from './util'

const ALPHA_NUMERIC = /[a-zA-Z0-0]/

export enum TokenType {
  Variable,
  Literal,
  PropertyAccess,
}

export interface LiteralToken {
  type: TokenType.Literal
  value: string
}

export interface VariableToken {
  type: TokenType.Variable
  name: string
}

export interface PropertyAccessToken {
  type: TokenType.PropertyAccess
  key: string
}

export type Token = LiteralToken | VariableToken | PropertyAccessToken

enum State {
  Unknown,
  Literal,
  Identifier,
  Variable,
  PropertyAccess,
}

/**
 * Tokenize the input string using a finite state machine
 *
 * @param input the input text, containing Go template tags
 */
export function tokenizePipeline(input: string) {
  const inputLength = input.length
  const tokens: Token[] = []

  let state: State = State.Unknown
  let capturedText = ''

  for (let idx = 0; idx < inputLength; idx++) {
    const char = input[idx]

    switch (state) {
      case State.Unknown: {
        if (char === '$') {
          state = State.Variable
        } else if (ALPHA_NUMERIC.test(char)) {
          state = State.Literal
          capturedText += char
        } else {
          throw new Error(`Unknown character: ${char}`)
        }
        break
      }

      case State.Literal: {
        if (ALPHA_NUMERIC.test(char)) {
          capturedText += char
        } else if (char === ' ') {
          tokens.push({type: TokenType.Literal, value: capturedText})
          capturedText = ''
        } else {
          console.log(tokens)
          throw new Error(`Invalid character in literal: ${char}`)
        }
        break
      }

      case State.PropertyAccess: {
        if (ALPHA_NUMERIC.test(char)) {
          capturedText += char
        } else if (char === ' ' || char === '.') {
          tokens.push({type: TokenType.PropertyAccess, key: capturedText})
          capturedText = ''
          state = char === '.' ? State.PropertyAccess : State.Unknown
        } else {
          throw new Error(`Invalid character in property name: ${char}`)
        }
        break
      }

      case State.Variable: {
        if (ALPHA_NUMERIC.test(char)) {
          capturedText += char
        } else if (char === ' ' || char === '.') {
          tokens.push({type: TokenType.Variable, name: capturedText})
          capturedText = ''
          state = char === '.' ? State.PropertyAccess : State.Unknown
        } else {
          throw new Error(`Invalid character in variable name: ${char}`)
        }
        break
      }

      default:
        assertNever(state)
    }
  }

  // Handle final state
  switch (state) {
    case State.Unknown: {
      break
    }
    // case State.Literal: {
    //   break
    // }
    case State.Variable: {
      break
    }
    case State.PropertyAccess: {
      break
    }

    default:
      assertNever(state)
  }

  return tokens
}
