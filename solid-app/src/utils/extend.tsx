import { styled } from "solid-styled-components";
import { GameNight } from "../views/game-view/game-night";
import { avatars } from "./avatars";
import { openModal } from "./modal";
import { randomArray } from "./random.tools";
import { GameConfig } from "./stage.tools"
import { Component } from "solid-js";
import { toast } from "./toast";

export type ExtendRule = {
    onNight?:(config: GameConfig, updateConfig: (config: GameConfig) => void) => void;
    onEveryRoundBegin?: (currentRound: number, config: GameConfig, updateConfig: (config: GameConfig) => void)=> void;
    onEveryRoundEnd?: (lastRound: number, config: GameConfig, updateConfig: (config: GameConfig) => void)=> void;
}
export const getExtendRule = (code: string):ExtendRule | void => {
    return EXTEND_RULES[code]
}

const lancelot_night_extend:ExtendRule['onNight'] = (config, updateConfig) => {
    const players = config.players;
    const new_players = JSON.parse(JSON.stringify(players)) as typeof players;
    for (const player of new_players) {
        if (player.code.startsWith('lancelot')) {
            player.nightInfo = []
        }
    }
    updateConfig({
        ...config,
        players: new_players
    })
}

const EXTEND_RULES:Record<string, ExtendRule> = {
    'lancelot#change_only_key_round': {
        onNight: lancelot_night_extend,
        onEveryRoundBegin: (currentRound, config, updateConfig) => {
            console.log("begin")
            let key_round = config.tasks.findIndex(d => d.failCount > 1);
            if (key_round < 0) {
                key_round = 3;
            }
            const key_round_readable = key_round + 1;
            if (currentRound !== key_round_readable) {
                return;
            }
            const change_card = [true, true, true, false, false];
            const [result] = randomArray(change_card)!;
            if (result) {
                const players = config.players.map(p => {
                    if(p.code.startsWith('lancelot')) {
                        const other_lancelot = Object.values(avatars).find(ap => (ap.code.startsWith('lancelot') && ap.code !== p.code));
                        console.log("aaa", p, other_lancelot);
                        return {
                            ...p,
                            ...other_lancelot,
                        }
                    }
                    return p;
                });
                updateConfig({
                    ...config,
                    players: players,
                });
            }
            openModal(ReviewContainer);
        }
    },
    'lancelot#change_every_round': {
        onNight: lancelot_night_extend,
        onEveryRoundEnd: (lastRound, config, updateConfig) => {
            const change_card = [true, true, true, false, false];
            const [result] = randomArray(change_card)!;
            if (result) {
                toast("请注意，兰斯特洛身份发生了转换，全体玩家重新确认身份！")
                const players = config.players.map(p => {
                    if(p.code.startsWith('lancelot')) {
                        const other_lancelot = Object.values(avatars).find(ap => (ap.code.startsWith('lancelot') && ap.code !== p.code));
                        console.log("aaa", p, other_lancelot);
                        return {
                            ...p,
                            ...other_lancelot,
                        }
                    }
                    return p;
                });
                updateConfig({
                    ...config,
                    players: players,
                });
                openModal(ReviewContainer);
            }else {
                toast("兰斯特洛身份未发生转换！")
            }
        }
    }
}

const Container = styled.div({
    width: '80%',
    background: '#fff',
    padding: '3rem 0'
})
const Title = styled.div({
    fontSize: '2rem',
    display:'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem'
})
const ReviewContainer:Component<any> = (close) => {
    const onDone = () => {
        close();
    }
    return (
        <Container>
            <Title>兰斯特洛拓展阶段</Title>
            <GameNight onDone={onDone}/>
        </Container>
    )
}