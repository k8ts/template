import {TemplateLexer} from './chev'

const lexingResult = TemplateLexer.tokenize('this {{ .works }} well!')
console.log(lexingResult)
