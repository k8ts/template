import {createToken, Lexer} from 'chevrotain'

// Text Mode
const Text = createToken({name: 'Text', pattern: /[^{]+/, line_breaks: true})
const OpenAction = createToken({name: 'OpenAction', pattern: /{{/})

// Action Mode
const CloseAction = createToken({name: 'CloseAction', pattern: /}}/})

export const TemplateLexer = new Lexer({
  modes: {
    text: [OpenAction, Text],
    action: [CloseAction],
  },
  defaultMode: 'text',
})
