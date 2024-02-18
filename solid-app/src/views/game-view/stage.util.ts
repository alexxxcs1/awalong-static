import { createContext } from 'solid-js';
import { AvatarType, getPlayerTeam } from "../../utils/game";
import { randomArray } from "../../utils/random.tools";

type StageType = 'night' | 'task'

export const generateGameConfig = (player_count: number) => {
    const team = getPlayerTeam(player_count)!;
    const player_team = randomArray(team.players);
    const tasks = generateTasks(player_count);
    return {
        ...team,
        players: player_team.map((d, idx) => {
            return {
                ...d,
                id: idx + 1,
            } as AvatarType & {
                id: number,
            }
        }),
        tasks: tasks,
    };
}

export type GameStageStore = {
    config: ReturnType<typeof generateGameConfig>
    stage: StageType,
    updateStage: (stage: StageType) => void,
}

export const GameStageContext = createContext<GameStageStore>()

type TaskRound = {
    id: number,
    taskPlayer: number,
    failCount: number,
}
const getTaskPlayersMap = (player_count: number):[number, number,number,number,number] | void => {
    if(player_count >= 8) {
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
        if(special && readable_round === 3) {
            failVoteCount = 2;
        }
        let task_player_count_map = getTaskPlayersMap(player_count);
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