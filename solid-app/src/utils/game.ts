export const getPlayerTeam = (num: number) => {
	const team = PLAYER_TEAM_MAP.find(d => d.count === num);
    return team;
}
export type AvatarType = {
    name: string,
    code: string,
    asset: string,
    type: 'protagonist' | 'villain',
    skill?: string
}
export const getCampName = (type: AvatarType['type']) => {
    if(type === 'protagonist') return '好人阵营';
    if(type === 'villain') return '反派阵营'
    return ''
}
type AvatarsCodes = 'merlin' | 'pacificville' | 'loyal' | 'morgana' | 'assassin' | 'oberon' | 'minions' | 'mordred'
const avatars:Record<AvatarsCodes, AvatarType> = {
    merlin: {
        name: '梅林',
        code: 'merlin',
        asset: './assets/avatars/Hero_gM.png',
        type: 'protagonist',
        skill: '梅林可以看到反派阵营的玩家(在9-10人游戏中，反派阵营的莫德雷德除外)，隐藏你自己的身份，如果被反派阵营猜中，反派刺客可以直接指认你结束游戏)'
    },
    pacificville: {
        name: '派西维尔',
        code: 'pacificville',
        asset: './assets/avatars/Hero_gP.png',
        type: 'protagonist',
        skill: '派西维尔可以看到 梅林 和 莫甘娜，但是无法分辨具体对应的人'
    },
    loyal: {
        name: '忠臣',
        code: 'loyal',
        type: 'protagonist',
        asset: './assets/avatars/Hero_gz.png'
    },
    morgana: {
        name: '莫甘娜',
        code: 'morgana',
        asset: './assets/avatars/Hero_bN.png',
        type: 'villain',
        skill: '莫甘娜可以被 好人阵营 的 派西维尔 看到，但是 派西维尔 不知道你的阵营(无法分辨你是莫甘娜还是梅林)'
    },
    assassin: {
        name: '刺客',
        code: 'assassin',
        asset: './assets/avatars/Hero_bA.png',
        type: 'villain',
        skill: '刺客可以在任何时候刺杀一位玩家，如果该玩家是梅林，则游戏结束，反派阵营胜利，反之好人阵营胜利'
    },
    oberon: {
        name: '奥伯伦',
        code: 'oberon',
        asset: './assets/avatars/Hero_bO.png',
        type: "villain",
        skill: '奥伯伦无法被反派阵营的队友看见，也无法看见反派阵营的队友，但是能被梅林看见'
    },
    minions: {
        name: '爪牙',
        code: 'minions',
        asset: './assets/avatars/Hero_bm.png',
        type: 'villain',
    },
    mordred: {
        name: '莫德雷德',
        code: 'mordred',
        asset: './assets/avatars/Hero_bK.png',
        type: 'villain',
        skill: '莫德雷德是无法被梅林看到的反派阵营老大'
    }
}
export const PLAYER_TEAM_MAP = [
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
]