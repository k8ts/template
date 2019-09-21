import {tokenize} from './lexer'

// function render(tokens: Token[]): string {
//   let renderedText = ''
//   for (let idx = 0; idx < tokens.length; idx += 1) {
//     const token = tokens[idx]

//     switch (token.type) {
//       case TokenType.Text: {
//         const prevToken: Token | undefined = tokens[idx - 1]
//         const nextToken: Token | undefined = tokens[idx + 1]
//         let value = token.value
//         if (prevToken && prevToken.type === TokenType.ChompRight) {
//           value = value.trimLeft()
//         }
//         if (nextToken && nextToken.type === TokenType.ChompLeft) {
//           value = value.trimRight()
//         }
//         renderedText += value
//         break
//       }

//       case TokenType.Action: {
//         renderedText += `[${token.value}]`
//         break
//       }

//       case TokenType.ChompLeft:
//       case TokenType.ChompRight:
//         break

//       default:
//         assertNever(token)
//     }
//   }
//   return renderedText
// }

const parsed = tokenize('{{23 -}} < {{- 45 | test (.this) | "}}" }}')
console.log(parsed)
// console.log(render(parsed))

// console.log(tokenizePipeline('if and .Values.prometheus.enabled (not .Values.prometheus.servicemonitor.enabled)'))
