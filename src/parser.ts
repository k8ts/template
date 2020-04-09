import {Token} from './lexer'
import {assertNever} from './util'

interface ActionNode {
  type: 'Action'
  children: Node[]
  trimLeft: boolean
  trimRight: boolean
}

interface TextNode {
  type: 'Text'
  value: string
}

type Node = ActionNode | TextNode

export function parse(tokens: Token[]) {
  const rootNodes: Node[] = []

  let parentNode: Node | undefined = undefined

  for (let idx = 0; idx < tokens.length; idx += 1) {
    const token = tokens[idx]

    switch (token.type) {
      case 'Assignment':
        break
      case 'CloseAction':
        break

      case 'Float':
        parentNode.children.push({type: token.type, token, parentNode, children: []})
        break

      case 'Function': {
        const functionNode: Node = {type: token.type, token, parentNode, children: []}
        parentNode.children.push(functionNode)
        parentNode = functionNode
        break
      }

      case 'GroupClose': {
        if (parentNode.type !== 'root') {
          parentNode = parentNode.parentNode
        }
        break
      }

      case 'GroupOpen': {
        const groupNode: Node = {type: token.type, token, parentNode, children: []}
        parentNode.children.push(groupNode)
        parentNode = groupNode
        break
      }

      case 'Integer':
        parentNode.children.push({type: token.type, token, parentNode, children: []})
        break
      case 'OpenAction': {
        const actionNode: Node = {type: token.type, token, parentNode, children: []}
        parentNode.children.push(actionNode)
        parentNode = actionNode
        break
      }

      case 'Pipe':
        break
      case 'PropertyAccess':
        break

      case 'String':
        parentNode.children.push({type: token.type, token, parentNode, children: []})
        break

      case 'Text':
        parentNode.children.push({type: token.type, token, parentNode, children: []})
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

  return removeParents(root)
}
