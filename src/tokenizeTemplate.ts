import {assertNever} from './util'

export enum TokenType {
  Action,
  Text,
  ChompLeft,
  ChompRight,
}

export interface ActionToken {
  type: TokenType.Action
  value: string
}

export interface TextToken {
  type: TokenType.Text
  value: string
}

export interface ChompLeftToken {
  type: TokenType.ChompLeft
}

export interface ChompRightToken {
  type: TokenType.ChompRight
}

export type Token = ActionToken | TextToken | ChompLeftToken | ChompRightToken

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
  let capturedText = ''

  for (let idx = 0; idx < inputLength; idx++) {
    const char = input[idx]

    switch (state) {
      case State.InDocument: {
        if (char === '{' && input[idx + 1] === '{') {
          state = State.InActionExpression
          if (capturedText.length) {
            tokens.push({type: TokenType.Text, value: capturedText})
            capturedText = ''
          }
          if (input[idx + 2] === '-' && input[idx + 3] === ' ') {
            tokens.push({type: TokenType.ChompLeft})
            idx += 2
          }
          idx += 1
        } else {
          capturedText += char
        }
        break
      }

      case State.InActionExpression: {
        const isEndToken = char === '}' && input[idx + 1] === '}'
        const isChompEndToken =
          char === ' ' && input[idx + 1] === '-' && input[idx + 2] === '}' && input[idx + 3] === '}'

        if (isEndToken || isChompEndToken) {
          state = State.InDocument
          if (capturedText.length) {
            tokens.push({type: TokenType.Action, value: capturedText.trim()})
            capturedText = ''
          }
          if (isEndToken) {
            idx += 1
          } else {
            idx += 3
            tokens.push({type: TokenType.ChompRight})
          }
        } else if (char === '"') {
          state = State.InActionExpressionQuotes
          capturedText += char
        } else {
          capturedText += char
        }
        break
      }

      case State.InActionExpressionQuotes: {
        capturedText += char
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
      if (capturedText.length) {
        tokens.push({type: TokenType.Text, value: capturedText})
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
