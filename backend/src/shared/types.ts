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
  disconnect = 'disconnect',
  join = 'join',

  placeShips = 'placeShips',
  waitForPlayer = 'waitForPlayer',
  readyForBattle = 'readyForBattle',

  fire = 'fire',
  hit = 'hit',
  miss = 'miss',
}

export const enum orientations {
  horizontal = "horizontal",
  vertical = "vertical",
}

export type JoinEventPayload = {
  playerAlias: playerAliases,
}
