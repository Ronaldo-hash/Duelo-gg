
export interface FoundationFile {
  name: string;
  path: string;
  content: string;
  description: string;
}

export interface MasterPlanPhase {
  id: string;
  title: string;
  tasks: MasterPlanTask[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface MasterPlanTask {
  id: string;
  description: string;
  completed: boolean;
  codeSnippet?: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface Match {
  id: number;
  player: string;
  rank: string;
  stake: number;
  reward: number;
  winRate: string;
  mode: string;
  status: string;
  creator_id?: string;
  opponent_id?: string;
  opponent_name?: string;
  opponent_game_id?: string;
  game_id?: string; // Creator's game ID
  password?: string | null;
  team_name?: string; // New: Clan Name
  team_logo?: string; // New: Clan Logo URL or Emoji
  match_players?: MatchPlayer[]; // New: 5v5 Roster
  proof_url?: string;
  winner_id?: string;
}

export interface MatchPlayer {
  id: number;
  match_id: number;
  user_id: string;
  username: string;
  team_side: 'A' | 'B';
  role: 'CAPTAIN' | 'MEMBER';
  status: 'PAID' | 'PENDING';
}
