import { AvatarType, avatars } from "./avatars";

export const getPlayerTeam = (num: number) => {
	const team = PLAYER_TEAM_MAP.find(d => d.count === num);
    return team;
}

export const getCampName = (type: AvatarType['type']) => {
    if(type === 'protagonist') return '绿色阵营';
    if(type === 'villain') return '红色阵营'
    return ''
}
export type Player = AvatarType & {
    id: number,
    nightInfo: Array<Player>
}
type PlayerTeamMapType = {
    count: number,
    players: Array<AvatarType>
    extra?: {
        type: string,
        name: string,
    }
}
export const PLAYER_TEAM_MAP:Array<PlayerTeamMapType> = [
    {
        count: 5,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
        ]
    },
    {
        count: 6,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
        ]
    },
    {
        count: 7,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
            avatars.oberon,
        ]
    },
    {
        count: 8,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
            avatars.minions,
        ]
    },
    {
        count: 9,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
            avatars.mordred,
        ]
    },
    {
        count: 10,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
            avatars.mordred,
            avatars.oberon,
        ]
    },
    {
        count: 11,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.lancelotBlue,
            avatars.morgana,
            avatars.assassin,
            avatars.mordred,
            avatars.lancelotRed
        ]
    },
    {
        count: 12,
        players: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.lancelotBlue,
            avatars.morgana,
            avatars.assassin,
            avatars.mordred,
            avatars.oberon,
            avatars.lancelotRed
        ]
    },
]

export const preloadResource = () => {
    const resources = Object.values(avatars).reduce<Array<string>>((result, data) => {
        if(data.asset) {
            result.push(data.asset);
        }
        return result
    }, []);
    const tmp = document.createElement('div');
    tmp.setAttribute('style', 'display:none;');
    document.body.appendChild(tmp);
    const load_promises = resources.map(r => {
        let resolver:(result: boolean) => void;
        const promise = new Promise<void>((resolve, reject) => {
            resolver = (result: boolean) => {
                if(result) {
                    resolve()
                }else{
                    reject();
                }
            };
        });
        const img = document.createElement('img');
        img.src = r;
        img.onload = () => {
            resolver(true);
        }
        img.onerror = () => {
            resolver(false)
        }
        tmp.appendChild(img);
        return promise;
    });
    return Promise.all(load_promises).finally(() => {
        tmp.parentNode!.removeChild(tmp);
    });
}