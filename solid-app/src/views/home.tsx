import { Button, Dropdown } from "solid-bootstrap";
import { SelectCallback } from "solid-bootstrap-core";
import { Component, For, createEffect, createMemo, createResource, createSignal, onMount, useContext } from "solid-js";
import { styled } from "solid-styled-components";
import { toast } from "../utils/toast";
import { PLAYER_TEAM_MAP, getPlayerTeam, preloadResource } from "../utils/game";
import { openModal } from "../utils/modal";
import { AvatarCard } from "../components/avatar.card";
import { GameAppControllerContext } from "../game.controller";
import { AvatarType } from "../utils/avatars";

const GameHomeContainer = styled.div({
    width: '100%',
    height: '100%',
    background: '#f1f1f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
});

const TitleContainer = styled.div({
    fontSize: '2rem',
    marginBottom: '1rem',
    fontWeight: 'bold'
})

const BuggtonGroup = styled.div({
    width: 'calc(100% - 1rem)',
    padding: '0 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    '& > *': {
        marginBottom: '.5rem',
    },
    '& > *:last-child': {
        marginBottom: 0,
    }
});
const PlayerCountContainer = styled.div({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    '.count': {
        margin: '0 .5rem',
        fontSize: '1.5rem',
        color: '#198754'
    }
})

const StartGameDropdownContainer = styled(Dropdown)({
    width: '100%',
});

const AvatarsContainer = styled.div({
    marginTop: '.5rem',
    width: 'calc(100% - 1rem)',
    padding: '0.5rem',
    
    borderRadius: '.5rem',
    '& > div': {
        marginBottom: '1rem',
        borderRadius: '.5rem',
        boxShadow: '#00000033 0px 10px 20px',
    },
    '& > div:last-child': {
        marginBottom: 0,
    }
});

const CampContainer = styled.div<{type: 'protagonist' | 'villain'}>((props) => {
    const main_color = props.type === 'protagonist' ? '#198754' : '#dc3545';
    return {
        width: '100%',
        background:main_color,
        padding: '0 .5rem',
        paddingBottom: '.5rem',
        '.title': {
            color: '#fff',
            fontSize: '1rem',
        },
        '.avatars': {
            background: '#fff',
        }
    }
});

export const HomeView:Component = () => {
    let last_player_count:number = 5;
    try {
        const last_player_count_string = localStorage.getItem('LAST_PLAYER_COUNT');
        if(last_player_count_string && !isNaN(Number(last_player_count_string))) {
            last_player_count = Number(last_player_count_string);
        }
    } catch (error) {
        
    }

    onMount(() => {
        preloadResource().then(() => {
            toast('预加载资源成功！')
        }).catch(err => {
            toast('预加载资源失败');
        })
    })

    const context = useContext(GameAppControllerContext);
    const [player_count, setPlayerCount] = createSignal<number>(last_player_count);
    const onSelect:SelectCallback = (eventKey, event) => {
        if(!eventKey) {
            toast("请选择正确的游玩人数！")
            return;
        }
        setPlayerCount(Number(eventKey));
    }
    createEffect(() => {
        const count = player_count();
        try {
            localStorage.setItem('LAST_PLAYER_COUNT', count.toString());
        } catch (error) {
            
        }
    })
    const team = createMemo(() => {
        const count = player_count();
        const team_data =  getPlayerTeam(count);
        return team_data?.players || ([] as NonNullable<typeof team_data>['players']);
    });

    const protagonist_team = createMemo(() => {
        return team().filter(d => d.type === 'protagonist')
    });
    const villaint_team = createMemo(() => {
        return team().filter(d => d.type === 'villain')
    });
    const onStartGame = () => {
        context?.updateCurrent(`game_stage?player_count=${player_count()}`);
    }

    return (
        <GameHomeContainer>
            <TitleContainer>
                Oh My Avalon
            </TitleContainer>
            <BuggtonGroup>
                <PlayerCountContainer class="player-count">当前游戏人数: <b class="count">{player_count()}</b>人</PlayerCountContainer>
                <StartGameDropdownContainer onSelect={onSelect}>
                    <Dropdown.Toggle style={{width: '100%'}} variant="secondary">选择游戏人数</Dropdown.Toggle>
                    <Dropdown.Menu style={{width: '100%'}} align={'start'}>
                        <For each={PLAYER_TEAM_MAP}>
                            {(item) => <Dropdown.Item active={player_count() === item.count} eventKey={item.count} >{item.count}人</Dropdown.Item>}
                        </For>
                    </Dropdown.Menu>
                </StartGameDropdownContainer>
                <Button style={{width: '100%'}} variant='primary' onclick={onStartGame}>开始游戏</Button>
            </BuggtonGroup>
            
            <AvatarsContainer>
                <CampContainer type='protagonist'>
                    <div class="title">绿色阵营</div>
                    <div class="avatars">
                        <For each={protagonist_team()}>
                            {(item) => (
                                <AvatarItem data={item} />
                            )}
                        </For>
                    </div>
                </CampContainer>
                <CampContainer type='villain'>
                    <div class="title">红色阵营</div>
                    <div class="avatars">
                        <For each={villaint_team()}>
                                {(item) => (
                                    <AvatarItem data={item} />
                                )}
                        </For>
                    </div>
                </CampContainer>
            </AvatarsContainer>
        </GameHomeContainer>
    )
}

const AvatarItemContainer = styled.div({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0.2rem 0',
    '.name': {
        textDecoration: 'underline',
    }
});

const AvatarItemModal = styled.div({
    width: '80vw',
    background: '#fff',
    borderRadius: '.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    '.content': {
        '.name': {
            fontSize: '1.5rem',
        }
    },
    '.foot': {
         margin: '.5rem 0'
    }
})

const AvatarItem:Component<{data: AvatarType}> = (props) => {
    const name = createMemo(() => {
        return props.data.name;
    });
    const openAvatarInfo = () => {
        openModal((close) => {
            const avatar_info_element = (
                <AvatarItemModal>
                    <AvatarCard data={props.data}></AvatarCard>
                    <div class="foot">
                        <Button variant="primary" onclick={close}>关闭</Button>
                    </div>
                </AvatarItemModal>
            )
            return avatar_info_element
        })
    }
    return (
        <AvatarItemContainer>
            <span class="name" onclick={openAvatarInfo}>{name()}</span>
        </AvatarItemContainer>
    )
}