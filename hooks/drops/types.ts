export enum DropVoteState {
  NOT_LOGGED_IN = "NOT_LOGGED_IN",
  NO_PROFILE = "NO_PROFILE",
  PROXY = "PROXY",
  CANT_VOTE = "CANT_VOTE",
  NO_CREDIT = "NO_CREDIT",
  IS_WINNER = "IS_WINNER", // State for winner drops
  VOTING_NOT_STARTED = "VOTING_NOT_STARTED", // State for when voting period hasn't started yet
  VOTING_ENDED = "VOTING_ENDED", // State for when voting period has ended
  PAUSED = "PAUSED", // Votes are paused for the move to the 6529 Network
  CAN_VOTE = "CAN_VOTE",
} 
