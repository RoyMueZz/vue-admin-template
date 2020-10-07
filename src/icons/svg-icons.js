import camelCase from 'xe-utils/methods/string/camelCase'

const req = require.context('./svg', false, /\.svg$/)
const requireAll = requireContext => requireContext.keys()

const re = /\.\/(.*)\.svg/
const svgIcons = {}

requireAll(req).forEach(i => {
  svgIcons[camelCase(i.match(re)[1])] = i.match(re)[1]
})

export default svgIcons
