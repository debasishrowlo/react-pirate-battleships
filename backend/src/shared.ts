export const enum cellTypes {
  empty = 0,
  ship = 1,
  damagedShip = 2,
  miss = 3,
}

export const enum playerAliases {
  p1 = "p1",
  p2 = "p2",
}

export const enum eventTypes {
  connect = 'connect',
  join = 'join',
  fire = 'fire',
  disconnect = 'disconnect',
  hit = 'hit',
  miss = 'miss',
}

export const enum orientations {
  horizontal = "horizontal",
  vertical = "vertical",
}