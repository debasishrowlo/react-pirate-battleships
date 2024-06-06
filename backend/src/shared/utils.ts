export const getPositionFromIndex = (index:number, cellsPerRow:number) => {
  const x = index % cellsPerRow
  const y = Math.floor(index / cellsPerRow)

  return { x, y }
}

export const getIndexFromPosition = (x:number, y:number, cellsPerRow:number) => {
  return (y * cellsPerRow + x)
}