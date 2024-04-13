export type AvatarType = {
    name: string,
    code: string,
    asset: string,
    type: 'protagonist' | 'villain',
    skill?: string
}
export type AvatarsCodes = 'merlin' | 'pacificville' | 'loyal' | 'morgana' | 'assassin' | 'oberon' | 'minions' | 'mordred' | 'lancelotGrren' | 'lancelotRed'
export const avatars:Record<AvatarsCodes, AvatarType> = {
    merlin: {
        name: '梅林',
        code: 'merlin',
        asset: './assets/avatars/merlin_green.png',
        type: 'protagonist',
        skill: '梅林可以看到红色阵营的玩家(在9-10人游戏中，红色阵营的莫德雷德除外)，隐藏你自己的身份，如果被红色阵营猜中，反派刺客可以直接指认你结束游戏)'
    },
    pacificville: {
        name: '派西维尔',
        code: 'pacificville',
        asset: './assets/avatars/pacificville_green.png',
        type: 'protagonist',
        skill: '派西维尔可以看到 梅林 和 莫甘娜，但是无法分辨具体对应的人'
    },
    loyal: {
        name: '忠臣',
        code: 'loyal',
        type: 'protagonist',
        asset: './assets/avatars/loyal_green.png'
    },
    morgana: {
        name: '莫甘娜',
        code: 'morgana',
        asset: './assets/avatars/morgana_red.png',
        type: 'villain',
        skill: '莫甘娜可以被 绿色阵营 的 派西维尔 看到，但是 派西维尔 不知道你的阵营(无法分辨你是莫甘娜还是梅林)'
    },
    assassin: {
        name: '刺客',
        code: 'assassin',
        asset: './assets/avatars/assassin_red.png',
        type: 'villain',
        skill: '刺客可以在任何时候刺杀一位玩家，如果该玩家是梅林，则游戏结束，红色阵营胜利，反之绿色阵营胜利'
    },
    oberon: {
        name: '奥伯伦',
        code: 'oberon',
        asset: './assets/avatars/oberon_red.png',
        type: "villain",
        skill: '奥伯伦无法被红色阵营的队友看见，也无法看见红色阵营的队友，但是能被梅林看见'
    },
    minions: {
        name: '爪牙',
        code: 'minions',
        asset: './assets/avatars/minions_red.png',
        type: 'villain',
    },
    mordred: {
        name: '莫德雷德',
        code: 'mordred',
        asset: './assets/avatars/mordred_red.png',
        type: 'villain',
        skill: '莫德雷德是无法被梅林看到的红色阵营老大'
    },
    lancelotGrren: {
        name: '兰斯洛特',
        code: 'lancelot_green',
        asset: './assets/avatars/lancelot_green.png',
        type: 'protagonist',
        skill: '兰斯洛特 是双生角色，由你和另外一位玩家扮演，非拓展模式下，你们能够互相看见'
    },
    lancelotRed: {
        name: '兰斯洛特',
        code: 'lancelot_red',
        asset: './assets/avatars/lancelot_red.png',
        type: 'villain',
        skill: '兰斯洛特 是双生角色，由你和另外一位玩家扮演，非拓展模式下，你们能够互相看见'
    }
}