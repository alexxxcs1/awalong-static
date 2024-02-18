import { Component, For, Show, createEffect, createMemo, createSignal, on, useContext } from "solid-js";
import { styled } from "solid-styled-components";
import { GameStageContext } from "./stage.util";
import { AvatarType } from "../../utils/game";
import { AvatarCard } from "../../components/avatar.card";
import { openModal } from "../../utils/modal";
import { Button } from "solid-bootstrap";
import { toast } from "../../utils/toast";

const GameNightContainer = styled.div({
    width: '100%',
    height: '100%',
    display: "flex",
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '.tip': {
        fontSize: '1.5rem',
        marginBottom: '1rem'
    },
    '.players': {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    '.actions': {
        marginTop: '1rem',
        width: '100%',
        padding: '.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }
})
export const GameNight:Component = () => {
    const context = useContext(GameStageContext);
    const players = context!.config.players;
    const [ready_player, updateReadyPlayer] = createSignal<Array<number>>([], {name: 'players_readystatus'});
    const onReady = (idx: number) => {
        const prev = [...ready_player()];
        prev.push(idx);
        updateReadyPlayer([...new Set(prev)])
    }
    const onUnReady = (idx: number) => {
        let prev = [...ready_player()];
        prev =  prev.filter(d => d!==idx);
        updateReadyPlayer([...new Set(prev)])
    }
    const all_ready = createMemo(() => {
        return ready_player().length === players.length;
    })
    const readyPlaye = () => {
        if(all_ready()) {
            toast('游戏开始！');
            context?.updateStage('task');
        }else{
            toast('所有玩家已确认身份后再开始游戏！')
        }
    }
    return (
        <GameNightContainer>
            <div class="tip">点击序号牌确认玩家身份</div>
            <div class="players">
                <For each={players}>
                    {(player, i) => (
                        <NightPlayer idx={i()+1} info={player} onReady={onReady.bind(void 0, i() + 1)} onUnReady={onUnReady.bind(void 0, i() + 1)}/>
                    )}
                </For>
            </div>
            <div class="actions">
                <Button variant={all_ready() ? 'success' : 'secondary'} style={{width: '60%'}} onclick={readyPlaye}>准备完毕</Button>
            </div>
        </GameNightContainer>
    )
}

const NightPlayerContainer = styled.div<{locked?: boolean}>((props) => {
    let main_color = "#333";
    if(props.locked) {
        main_color = '#0d6efd'
    }
    return {
        width: '15%',
        margin: '.2rem',
        position: 'relative',
        '.info': {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: main_color,
            color: '#fff',
            borderRadius: '.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold'
        },
        '&::after': {
            display: 'block',
            content: '""',
            paddingBottom: '100%',
        }
    }
});
type NightPlayerProps = {
    idx: number,
    info: AvatarType,
    onReady: () => void
    onUnReady: () => void
}
const ModalContainer = styled.div({
    width: '80vw',
});
const InfoContainer = styled.div({
    width: '100%',
    marginBottom: '1rem',
    '.id-card': {
        margin: '.1rem',
        width: '2rem',
        height: '2rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#333',
        color: '#fff',
        fontWeight: 'bold',
        borderRadius: '.4rem'
    }
})
const NightPlayer:Component<NightPlayerProps> = (props) => {
    const [locked, updateLock] = createSignal(false, {equals: (prev, next) => prev === next});
    const [reunlock, updateReunlock] = createSignal(0);
    const context = useContext(GameStageContext);
    const players = context!.config.players;
    createEffect(on(locked, (v) => {
        if(v) {
            props.onReady();
        }else{
            props.onUnReady();
        }
    }));
    const onClickCard = () => {
        if(locked()) {
            toast('已确认身份，身份已锁定！');
            const reunlock_count = reunlock() + 1;
            if(reunlock_count > 10) {
                updateLock(false);
                updateReunlock(0);
            }else{
                updateReunlock(reunlock_count);
            }
            return;
        }
        openModal((close) => {
            const villain = players.filter(d => d.type === 'villain');
            const villain_without_oberon = villain.filter(d => d.code !== 'oberon');
            const villain_without_mordred = villain.filter(d => d.code !== 'mordred');
            const merlin_morgana = players.filter(d => ['merlin','morgana'].includes(d.code));
            let night_info:typeof players = [];
            if(props.info.type === 'villain') {
                night_info = villain_without_oberon;
            }
            if(props.info.code === 'merlin') {
                night_info = villain_without_mordred;
            }
            if(props.info.code === 'pacificville') {
                night_info = merlin_morgana;
            }
            if(props.info.code === 'oberon') {
                night_info = [];
            }
            const extend = () => {
                const onclose = () => {
                    updateLock(true);
                    close();
                }
                return (
                    <div>
                        <Show when={!!night_info.length}>
                            <InfoContainer>
                                你看到的信息: 
                                <For each={night_info}>
                                    {(i) => (
                                        <span class="id-card">{i.id}</span>
                                    )}
                                </For>
                            </InfoContainer>
                        </Show>
                        <Button style={{width: '100%'}} onclick={onclose}>#{props.idx}号玩家 确认身份</Button>
                    </div>
                )
            }
            const modal_content = (
                <ModalContainer>
                    <AvatarCard data={props.info} extend={extend}/>
                </ModalContainer>
            )
            return modal_content;
        });
    }
    return (
        <NightPlayerContainer locked={locked()} onclick={onClickCard}>
            <div class="info">
                {props.idx}
            </div>
        </NightPlayerContainer>
    )
}