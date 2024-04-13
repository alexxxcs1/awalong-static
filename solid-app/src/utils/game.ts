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
export type PlayerTeamMapType = {
    count: number,
    name?: string,
    extend_codes?: Array<{
        name: string,
        code: string,
    }>,
    avatars: Array<AvatarType>
}
export const PLAYER_TEAM_MAP:Array<PlayerTeamMapType> = [
    {
        count: 5,
        avatars: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.morgana,
            avatars.assassin,
        ]
    },
    {
        count: 6,
        avatars: [
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
        avatars: [
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
        avatars: [
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
        avatars: [
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
        avatars: [
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
        extend_codes: [{ name: '兰斯洛特关键局随机轮换', code: 'lancelot#change_only_key_round' }, {name: '兰斯洛特每轮随机轮换', code: 'lancelot#change_every_round'}],
        avatars: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.lancelotGrren,
            avatars.morgana,
            avatars.assassin,
            avatars.mordred,
            avatars.lancelotRed
        ]
    },
    {
        count: 12,
        extend_codes: [{ name: '兰斯洛特关键局随机轮换', code: 'lancelot#change_only_key_round' }, {name: '兰斯洛特每轮随机轮换', code: 'lancelot#change_every_round'}],
        avatars: [
            avatars.merlin,
            avatars.pacificville,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.loyal,
            avatars.lancelotGrren,
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