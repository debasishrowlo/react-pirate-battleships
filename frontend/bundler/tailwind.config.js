const fontSize = {}

const pxToRem = (px, base = 16) => {
  return `${px / base}rem`
}

const minFontSize = 12
const maxFontSize = 70
let i = minFontSize
while (i <= maxFontSize) {
  fontSize[i] = pxToRem(i)
  i += 2
}

const borderRadius = [0, 2, 4, 6, 8, 12, 16, 24].reduce((acc, cur) => {
  acc[cur] = pxToRem(cur)
  return acc
}, {})
borderRadius["full"] = "9999px"

module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  corePlugins: {
    container: false,
  },
  theme: {
    extend: {
      borderRadius,
      fontSize,
    }
  },
  plugins: [],
}