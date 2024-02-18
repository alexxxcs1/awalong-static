import { Component, Match, Switch, createContext, createMemo, useContext } from "solid-js";
import { GameAppControllerContext } from "../../game.controller";
import { getPlayerTeam } from "../../utils/game";
import { toast } from "../../utils/toast";
import { randomArray } from "../../utils/random.tools";
import { styled } from "solid-styled-components";
import { createStore, produce } from "solid-js/store";
import { GameNight } from "./game-night";
import { generateGameConfig, GameStageContext, GameStageStore } from "./stage.util";
import { Dropdown } from "solid-bootstrap";
import { SelectCallback } from "solid-bootstrap-core";
import { GameTask } from "./game-task";

const GameStageContainer = styled.div({
    width: '100%',
    height: '100%',
    background: '#f1f1f1',
    overflow: 'hidden'
})

const CommonActions  = styled.div({
    position: 'absolute',
    top: '1rem',
    right: '1rem',
})

export const GameStageControllerView:Component = () => {
    const store = useContext(GameAppControllerContext);
    const player_count = createMemo(() => {
        const player_num = Number(store?.query?.player_count);
        if(isNaN(player_num)) {
            toast("游戏人数配置错误!");
            store?.updateCurrent('game_home');
            return 0;
        }
        return player_num
    });
    const game_config = generateGameConfig(player_count());
    
    const [game_stage_store, setGameStage] = createStore<GameStageStore>({
        config: game_config,
        stage: 'task',
        updateStage: (stage) => {
            setGameStage(produce(prev => {
                prev.stage = stage;
            }))
        },
    });

    const onMenuClick:SelectCallback = (key) => {
        if(key === 'return_home') {
            store?.updateCurrent('game_home');
        }
    }
    
    return (
        <GameStageContext.Provider value={game_stage_store}>
            <CommonActions>
            <Dropdown onSelect={onMenuClick}>
                <Dropdown.Toggle size="sm" variant="success" id="dropdown-basic">菜单</Dropdown.Toggle>
                <Dropdown.Menu>
                    <Dropdown.Item eventKey={'return_home'}>返回首页</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            </CommonActions>
            <GameStageContainer>
                <Switch>
                    <Match when={game_stage_store.stage === 'night'}>
                        <GameNight />
                    </Match>
                    <Match when={game_stage_store.stage === 'task'}>
                        <GameTask />
                    </Match>
                </Switch>
            </GameStageContainer>
        </GameStageContext.Provider>
    )
}