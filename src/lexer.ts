import {assertNever} from './util'

export type Token =
  | {type: 'Assignment'; existing: boolean}
  | {type: 'CloseAction'}
  | {type: 'Float'; value: string}
  | {type: 'Function'; name: string}
  | {type: 'GroupClose'}
  | {type: 'GroupOpen'}
  | {type: 'Integer'; value: string}
  | {type: 'OpenAction'}
  | {type: 'Pipe'}
  | {type: 'PropertyAccess'; property: string}
  | {type: 'String'; value: string}
  | {type: 'Text'; value: string}
  | {type: 'TrimCloseAction'}
  | {type: 'TrimOpenAction'}
  | {type: 'Variable'; name: string}

enum State {
  Assignment,
  AssignmentCandidate,
  Dash,
  Float,
  FloatCandidate,
  Function,
  Integer,
  PropertyAccess,
  String,
  Text,
  Unknown,
  Variable,
  VariableCandidate,
}

const ALPHA = /[a-zA-Z]/
const ALPHA_NUMERIC = /[a-zA-Z0-9]/
const NUMBER = /[0-9]/
const PROPERTY_NAME = /[a-zA-Z0-9_\-]/
const TERMINATOR = /[ .})|]/
const VALUE_START = /[a-zA-Z0-9.("]/

/**
 * Tokenize the input string using a finite state machine
 *
 * @param input the input text, containing Go template tags
 */
export function tokenize(input: string) {
  const inputLength = input.length
  const tokens: Token[] = []

  let state: State = State.Text
  let buffer = ''

  for (let idx = 0; idx < inputLength; idx++) {
    const char = input[idx]

    switch (state) {
      case State.Assignment: {
        if (VALUE_START.test(char) || (char === '-' && NUMBER.test(input[idx + 1]))) {
          idx -= 1
          state = State.Unknown
        } else if (char === ' ') {
          // Ignore spaces
        } else {
          throw new Error(`Invalid character '${char}', expected start of a value`)
        }
        break
      }

      case State.AssignmentCandidate: {
        if (char === '=') {
          tokens.push({type: 'Assignment', existing: false})
          state = State.Assignment
        } else {
          throw new Error(`Invalid character '${char}', expected '='`)
        }
        break
      }

      case State.Dash: {
        if (NUMBER.test(char)) {
          buffer += char
          state = State.Integer
        } else {
          throw new Error(`Invalid character '${char}', expected number`)
        }
        break
      }

      case State.Float: {
        if (NUMBER.test(char)) {
          buffer += char
        } else if (TERMINATOR.test(char)) {
          tokens.push({type: 'Float', value: buffer})
          buffer = ''
          idx -= 1
          state = State.Unknown
        } else {
          throw new Error(`Invalid character '${char}', expected number or separator`)
        }
        break
      }

      case State.FloatCandidate: {
        if (NUMBER.test(char)) {
          buffer += char
          state = State.Float
        } else {
          throw new Error(`Invalid character '${char}', expected number`)
        }
        break
      }

      case State.Function: {
        if (ALPHA_NUMERIC.test(char)) {
          buffer += char
        } else if (TERMINATOR.test(char)) {
          tokens.push({type: 'Function', name: buffer})
          buffer = ''
          state = State.Unknown
        } else {
          throw new Error(`Invalid character '${char}', expected alphanumeric or terminator`)
        }
        break
      }

      case State.Integer: {
        if (NUMBER.test(char)) {
          buffer += char
        } else if (char === '.') {
          buffer += char
          state = State.FloatCandidate
        } else if (TERMINATOR.test(char)) {
          tokens.push({type: 'Integer', value: buffer})
          buffer = ''
          idx -= 1
          state = State.Unknown
        } else {
          throw new Error(`Invalid character '${char}', expected number, separator, or '.'`)
        }
        break
      }

      case State.PropertyAccess: {
        if (PROPERTY_NAME.test(char)) {
          buffer += char
        } else if (TERMINATOR.test(char)) {
          tokens.push({type: 'PropertyAccess', property: buffer})
          buffer = ''
          idx -= 1
          state = State.Unknown
        } else {
          throw new Error(`Invalid character '${char}', expected alphanumeric or terminator`)
        }
        break
      }

      case State.Text: {
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
          state = State.Unknown
        } else {
          buffer += char
        }
        break
      }

      case State.String: {
        if (char === '"' && input[idx - 1] !== '\\') {
          tokens.push({type: 'String', value: buffer})
          buffer = ''
          state = State.Unknown
        } else {
          buffer += char
        }
        break
      }

      case State.Unknown: {
        if (NUMBER.test(char)) {
          buffer += char
          state = State.Integer
        } else if (char === '$') {
          buffer += char
          state = State.VariableCandidate
        } else if (char === '"') {
          state = State.String
        } else if (char === ':') {
          state = State.AssignmentCandidate
        } else if (char === '=') {
          tokens.push({type: 'Assignment', existing: true})
          state = State.Assignment
        } else if (char === '-') {
          buffer += char
          state = State.Dash
        } else if (ALPHA.test(char)) {
          buffer += char
          state = State.Function
        } else if (char === '(') {
          tokens.push({type: 'GroupOpen'})
        } else if (char === ')') {
          tokens.push({type: 'GroupClose'})
        } else if (char === '|') {
          tokens.push({type: 'Pipe'})
        } else if (char === '.') {
          state = State.PropertyAccess
        } else if (char === ' ') {
          // Ignore spaces here
        } else if (char === ' ' && input[idx + 1] === '-' && input[idx + 2] === '}' && input[idx + 3] === '}') {
          tokens.push({type: 'TrimCloseAction'})
          buffer = ''
          idx += 3
          state = State.Text
        } else if (char === '}' && input[idx + 1] === '}') {
          tokens.push({type: 'CloseAction'})
          buffer = ''
          idx += 1
          state = State.Text
        } else {
          throw new Error(`Unexpected character: '${char}'`)
        }
        break
      }

      case State.Variable: {
        if (ALPHA_NUMERIC.test(char)) {
          buffer += char
        } else if (TERMINATOR.test(char)) {
          tokens.push({type: 'Variable', name: buffer})
          buffer = ''
          idx -= 1
          state = State.Unknown
        } else {
          throw new Error(`Unexpected character, expected alphanumeric or terminator, got: '${char}'`)
        }
        break
      }

      case State.VariableCandidate: {
        if (ALPHA.test(char)) {
          buffer += char
          state = State.Variable
        } else if (TERMINATOR.test(char)) {
          tokens.push({type: 'Variable', name: buffer})
          buffer = ''
          idx -= 1
          state = State.Unknown
        } else {
          throw new Error(`Unexpected character, expected alpha or terminator, got: '${char}'`)
        }
        break
      }

      default:
        assertNever(state)
    }
  }

  // Handle final state
  if (state !== State.Text) {
    throw new Error(`Invalid file, expected file end, got unknown token: ${State[state]}`)
  }

  if (buffer.length) {
    tokens.push({type: 'Text', value: buffer})
  }

  return tokens
}
