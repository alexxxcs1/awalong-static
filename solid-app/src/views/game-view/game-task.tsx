import { Component, For, Show, createEffect, createMemo, createSignal, on, useContext } from "solid-js"
import { styled } from "solid-styled-components"
import { GameStageContext, generateGameConfig } from "./stage.util";
import { Button } from "solid-bootstrap";
import { openModal } from "../../utils/modal";
import { toast } from "../../utils/toast";
import { randomArray } from "../../utils/random.tools";
import { AvatarType, getCampName } from "../../utils/game";

const GameTaskContainer = styled.div({
    width: '100%',
    height: '100%',
    display: "flex",
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    '.round-box': {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
    },
    '.result': {
        fontSize: '1.2rem',
        marginBottom: '2rem'
    }
});
const TaskBox = styled.div<{success: boolean | void}>((props) => {
    let main_color = '#333';
    if (props.success === true) {
        main_color = '#198754'
    }else if(props.success === false) {
        main_color = '#dc3545'
    }
    return {
        width: '80%',
        // height: '4rem',
        margin: '.2rem 0',
        borderRadius: '.4rem',
        background: main_color,
        color: '#fff',
        '.task-name': {
            fontSize: '1.2rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        '.task-info': {
            fontSize: '.8rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
        },
        '.task-result': {
            width: '100%',
        }
    }
});
const TaskResult = styled.div({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
})
const TaskResultVote = styled.div<{success: boolean}>((props) => {
    const main_color = props.success ? '#198754' : '#dc3545';
    return {
        width: '1rem',
        height: '1rem',
        background: main_color,
        margin: '.4rem',
        border: '.2rem solid #333'
    }
})
type TaskStatus = {
    votes: Array<VoteStatus>
}
export const GameTask:Component = () => {
    const context = useContext(GameStageContext);
    const [task_status, updateTaskStatus] = createSignal<Array<TaskStatus>>([]);
    const [success_camp, updateCampResult] = createSignal<AvatarType['type']>(); 
    const tasks = context?.config.tasks;

    const result_content = createMemo(() => {
        const successed = success_camp();
        if(successed !== void 0) {
            const success_camp_name = getCampName(successed);
            return `游戏已结束！${success_camp_name}取得胜利`;
        }
    })

    const startVote = (index: number) => {
        const result_content_data = result_content();
        if(result_content_data) {
            toast(result_content_data)
            return;
        }

        const readable_index = index + 1;
        const status = task_status()[index];
        if(status) {
            toast(`第${readable_index}轮投票已经结束！`)
            return;
        }
        if(index !== task_status().length) {
            toast(`第${readable_index}轮投票尚未开始，当前第${task_status.length + 1}轮游戏！`)
            return;
        };
        const task = tasks![index];
        
        openModal((close) => {
            const onConfirm = (votes:Array<VoteStatus>) => {
                const state = [...task_status()];
                const random_vote = randomArray(votes);
                if(state[index]) {
                    state[index].votes = random_vote;
                } else {
                    state.push({
                        votes: random_vote,
                    })
                }
                updateTaskStatus(state)
                close();
            }
            return (
                <VoteSelector onConfirm={onConfirm} cannel={close} players={context?.config.players!} task={task}/>
            )
        })
    };

    const rounds = createMemo(() => {
        const status = task_status();
        return (tasks || []).map((task, idx) => {
            const current_status = status[idx];
            let task_success;
            if(current_status) {
                const current_fail = current_status.votes.filter(d => !d.vote);
                if(current_fail.length >= task.failCount) {
                    task_success = false;
                }else{
                    task_success = true;
                }
            }
            return {
                ...task,
                status: current_status,
                success: task_success,
            }
        })
    });
    
    createEffect(() => {
        const rounds_data = rounds();
        const successed = rounds_data.filter(d => d.success === true);
        const failed = rounds_data.filter(d => d.success === false);
        
        
        if(successed.length >= 3) {
            openModal((close) => {
                const onAssassinKillResult = (success_kill: boolean) => {
                    if(!success_kill) {
                        updateCampResult('protagonist')
                    }else{
                        updateCampResult('villain');
                    }
                    close();
                }
                return (
                    <AssassinModal players={context?.config.players!} onUpdateResult={onAssassinKillResult}/>
                )
            });
            toast('好人阵营取得优势！反派阵营刺客可以开始指认梅林！');
        } else if(failed.length >= 3) {
            toast('反派阵营胜利！');
            updateCampResult('villain')
        }
    });

    

    return (
        <GameTaskContainer>
            <Show when={result_content() !== void 0}>
                <div class="result">
                    {result_content()}
                </div>
            </Show>
            <div class="round-box">
                <For each={rounds()}>
                    {(task, idx) => {
                        return (
                            <TaskBox success={task.success} onclick={startVote.bind(void 0, idx())}>
                                <div class="task-name">
                                    第{task.id}轮
                                </div>
                                <Show when={!!task.status}>
                                    <TaskResult>
                                        <For each={task.status.votes}>
                                            {(vote_data) => (
                                                <TaskResultVote success={vote_data.vote}/>
                                            )}
                                        </For>
                                    </TaskResult>
                                </Show>
                                <Show when={!task.status}>
                                    <div class="task-info">
                                        <div>
                                            需要 <b style="font-size: 1.2rem">{task.taskPlayer}</b> 位玩家参加任务
                                        </div>
                                        <Show when={task.failCount > 1}>
                                            <div>
                                                该轮任务需要有 <b style="font-size: 1.2rem">{task.failCount}</b> 票 失败票才会失败
                                            </div>
                                        </Show>
                                    </div>
                                </Show>
                            </TaskBox>
                        )
                    }}
                </For>
            </div>
        </GameTaskContainer>
    )
}

const VoteModal = styled.div({
    width: '100%',
    height: '100%',
    background: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    '.player-tip': {
        fontSize: '1rem',
        width: '80%',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '.4rem',
        '.bold-font': {
            margin: '.4rem',
            fontSize: '1.5rem',
            fontWeight: 'bold'
        }
    },
    '.player-selector': {
        width: '80%',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginTop: '.4rem'
    },
    '.player-vote-confirm': {
        width: '80%',
        marginTop: '2rem',
        'button': {
            margin: '.4rem 0',
            width: '100%'
        }
    }
});
const PlayerSelectorBox = styled.div<{selected: boolean}>((props) => {
    const main_color = props.selected ? '#0d6efd' : '#f1f1f1';
    const font_color = props.selected ? '#fff' : '#333';
    return {
        fontWeight: 'bold',
        margin: '.2rem',
        background: main_color,
        borderRadius: '.4rem',
        color: font_color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '3rem',
        height: '3rem',
    }
})
const VoteBoxWapper = styled.div({
    width: '100%',
    height: '100%',
    background: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    '& > div': {
        marginBottom: '.4rem'
    },
    '.vote-tip': {
        fontSize: '1.2rem',
        color: '#fff',
    },
    '.vote-box': {
        width: '90%',
        height: '10rem',
        // background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '.4rem',
        '& > div': {
            width: '50%',
            height: '100%',
            margin: '.4rem',
            background: '#fff',
            borderRadius: '.4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontSize: '2rem',
            '.select-icon': {
                fontSize: '1rem',
            }
        },
        '.success': {
            background: '#198754',
            color: '#fff',
        },
        '.fail': {
            background: '#dc3545',
            color: '#fff',
        }
    },
    '.vote-action-button': {
        width: '80%',
        'button': {
            width: '100%',
            margin: '.4rem 0',
        }
    }
});
type VoteStatus = {
    player: ReturnType<typeof generateGameConfig>['players'][0],
    vote: boolean
}
const VoteSelector:Component<{
        cannel: () => void,
        players: ReturnType<typeof generateGameConfig>['players'], 
        task: ReturnType<typeof generateGameConfig>['tasks'][0]
        onConfirm: (voted: Array<VoteStatus>) => void
    }> = (props) => {
    const [vote_status, updateVoteStatus] = createSignal<Array<VoteStatus>>([]);

    const last_vote = createMemo(() => {
        return props.task.taskPlayer - vote_status().length;
    });

    const startVote = (player: typeof props.players[0]) => {
        const voted = vote_status().find(d => d.player.id === player.id);
        if(voted) return;
        if(last_vote() <= 0) return;
        openModal((close) => {
            let [vote_succces, updateVoteSuccess] = createSignal<boolean | void>(void 0);
            const onVote = (success: boolean) => {
                if(player.type === 'protagonist' && !success) {
                    toast('好人阵营无法投出失败票！', {timeout: 1000});
                    return;
                }
                updateVoteSuccess(success);
            }
            const onSubmit = () => {
                if(vote_succces() === void 0) return;
                const status = [...vote_status()];
                status.push({
                    player: player,
                    vote: vote_succces()!
                })
                updateVoteStatus(status);
                close();
            }
            return (
                <VoteBoxWapper>
                    <div class="vote-tip">
                        <b>{player.id}</b> 号玩家 开始投票
                    </div>
                    <div class="vote-box">
                        <div class="success" onclick={onVote.bind(void 0, true)}>
                            成功
                            <Show when={vote_succces() === true}>
                                <span class="select-icon">已选择</span>
                            </Show>
                        </div>
                        <div class="fail" onclick={onVote.bind(void 0, false)}>
                            失败
                            <Show when={vote_succces() === false}>
                                <span class="select-icon">已选择</span>
                            </Show>
                        </div>
                    </div>
                    <div class="vote-action-button">
                        <Button variant={vote_succces() !== void 0? 'primary' : 'secondary'} onclick={onSubmit}>确定</Button>
                        <Button variant='secondary' onclick={close}>取消</Button>
                    </div>
                </VoteBoxWapper>
            )
        })
    }
    

    const player_selector_data = createMemo(() => {
        const status = vote_status();
        const players = props.players;
        return players.map(d => {
            return {
                ...d,
                voted: !!status.find(s => s.player.id === d.id)
            }
        })
    });

    const confirm = () => {
        if(vote_status().length !== props.task.taskPlayer) {
            toast(`还剩${last_vote()}位玩家未参与投票！`)
            return
        }
        props.onConfirm(vote_status());
    }
    
    return (
        <VoteModal>
            <div class="player-tip">
                第 <span class="bold-font">{props.task.id}</span> 轮游戏
            </div>
            <Show when={props.task.failCount > 1}>
                <div class="player-tip">本次任务需要  <span class="bold-font">{props.task.failCount}</span> 失败票才会失败</div>
            </Show>
            <div class="player-tip">
                本轮游戏还需要<span class="bold-font">{last_vote()}</span>位玩家参与投票
            </div>
            <div class="player-tip">
                选择投票的玩家
            </div>
            
            <div class="player-selector">
                <For each={player_selector_data()}>
                    {(player) => {
                        return (
                            <PlayerSelectorBox selected={player.voted} onclick={() => startVote(player)}>
                                {player.id}
                            </PlayerSelectorBox>
                        )
                    }}
                </For>
            </div>

            <div class="player-vote-confirm">
                <Button onclick={confirm}>确认票型</Button>
                <Button variant="secondary" onclick={props.cannel}>返回</Button>
            </div>
        </VoteModal>
    )
}

const AssassinModalContainer = styled.div({
    padding: '2rem',
    width: '90%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    borderRadius: '.4rem',
    '.player-selector-box': {
        margin: '.4rem 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    '.confirm': {
        width: '100%',
    }
});
type AssassinModalProps = {
    players: ReturnType<typeof generateGameConfig>['players'],
    onUpdateResult: (success_kill: boolean) => void
}
const AssassinModal:Component<AssassinModalProps> = (props) => {
    const [selected, updateSelected] = createSignal<number>();
    const assassin = createMemo(() => {
        return props.players.find(d => d.code === 'assassin')!;
    })
    const players = createMemo(() => {
        return props.players.map((d, index) => {
            const selected_player = selected() === index;
            return {
                ...d,
                selected: selected_player,
            }
        })
    });
    const onSelected = (index: number) => {
        updateSelected(index);
    };

    const onKill = () => {
        const selected_taget = selected();
        if(selected_taget === void 0) {
            toast('请先选择一个要刺杀的目标！');
        }else{
            const target = players()[selected_taget];
            if(target.code !== 'merlin') {
                toast('刺杀梅林失败，好人阵营胜利！');
                props.onUpdateResult(false);
            }else{
                toast('刺杀梅林成功！反派阵营胜利！');
                props.onUpdateResult(true);
            }
        }
    }
    return (
        <AssassinModalContainer>
            <div class="tip">
                <b>{assassin().id}号玩家</b> 请选择需要刺杀的玩家
            </div>
            <div class="player-selector-box">
                <For each={players()}>
                    {(player, idx) => {
                        return (
                            <PlayerSelectorBox selected={player.selected} onclick={onSelected.bind(void 0, idx())}>
                                {player.id}
                            </PlayerSelectorBox>
                        )
                    }}
                </For>
            </div>
            <Button onclick={onKill} class="confirm" variant={selected() !== void 0 ? 'primary' : 'secondary'}>确定</Button>
        </AssassinModalContainer>
    )
}