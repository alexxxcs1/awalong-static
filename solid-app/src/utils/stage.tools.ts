import { createContext } from 'solid-js';
import { Player, PlayerTeamMapType, getPlayerTeam } from "./game";
import { randomArray } from "./random.tools";
import { ExtendRule } from './extend';

type StageType = 'night' | 'task'

export type GameConfig = PlayerTeamMapType & {
    players: Array<Player>
    tasks: Array<TaskRound>
}
export const generateGameConfig = (player_count: number):GameConfig => {
    const team = getPlayerTeam(player_count)!;
    const player_team = randomArray(team.avatars);
    const tasks = generateTasks(player_count);
    const _players = player_team.map<Player>((d, idx) => {
        return {
            ...d,
            id: idx + 1,
            nightInfo: []
        }
    })
    const players = _players.map(player => {
        const villain = _players.filter(d => d.type === 'villain');
        const villain_without_oberon = villain.filter(d => d.code !== 'oberon');
        const villain_without_mordred = villain.filter(d => d.code !== 'mordred');
        const merlin_morgana = _players.filter(d => ['merlin','morgana'].includes(d.code));
        let night_info:typeof _players = [];
        if(player.type === 'villain') {
            night_info = villain_without_oberon;
        }
        if(player.code === 'merlin') {
            night_info = villain_without_mordred;
        }
        if(player.code === 'pacificville') {
            night_info = merlin_morgana;
        }
        if(player.code === 'oberon') {
            night_info = [];
        }
        if(player.code.startsWith('lancelot')) {
            const other = _players.find(d => d.code.startsWith('lancelot') && d.code !== player.code);
            night_info = [other!];
        }
        return {
            ...player,
            nightInfo: night_info
        }
    });
    return {
        ...team,
        players: players,
        tasks: tasks,
    };
}

export type GameStageStore = {
    config: GameConfig
    stage: StageType,
    extendRule?: ExtendRule | void
    updateStage: (stage: StageType) => void
    updateConfig: (config: GameConfig) => void
}

export const GameStageContext = createContext<GameStageStore>()

type TaskRound = {
    id: number,
    taskPlayer: number,
    failCount: number,
}
const getTaskPlayersMap = (player_count: number):[number, number,number,number,number] | void => {
    if(player_count >= 10) {
        return [3,4,5,6,6]
    }else if(player_count >= 8) {
        return [3,4,4,5,5];
    }else if(player_count === 7) {
        return [2,3,3,4,4];
    }else if(player_count === 6) {
        return [2,3,4,3,4];
    }else if(player_count === 5) {
        return [2,3,2,3,3];
    }
}
const generateTasks = (player_count: number) => {
    const special = player_count >=7;
    const task = Array.from({length: 5}).reduce<Array<TaskRound>>((result, _, index) => {
        const readable_round = index + 1;
        let failVoteCount = 1;
        
        let task_player_count_map = getTaskPlayersMap(player_count);
        if(special && task_player_count_map) {
            const last_vote_num = [...task_player_count_map].pop()!;
            const firstMaxVoteIndex = task_player_count_map.findIndex(d => d === last_vote_num);
            const firstMaxViteIndexReadable = firstMaxVoteIndex + 1;
            if(firstMaxViteIndexReadable === readable_round) {
                failVoteCount = 2;
            } 
        }
        if(!task_player_count_map) {
            return result;
        }
        const current_task_player = task_player_count_map[index];
        const data = {
            id: readable_round,
            taskPlayer: current_task_player,
            failCount: failVoteCount,
        }
        result.push(data);
        return result;
    }, []);
    return task;
}