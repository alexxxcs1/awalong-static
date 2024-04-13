import { Component, Match, Switch, createMemo, useContext } from "solid-js";
import { GameAppControllerContext } from "../../game.controller";
import { toast } from "../../utils/toast";
import { styled } from "solid-styled-components";
import { createStore, produce } from "solid-js/store";
import { GameNight } from "./game-night";
import { generateGameConfig, GameStageContext, GameStageStore } from "../../utils/stage.tools";
import { Dropdown } from "solid-bootstrap";
import { SelectCallback } from "solid-bootstrap-core";
import { GameTask } from "./game-task";
import { getExtendRule } from "../../utils/extend";

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
    const extend_rule = createMemo(() => {
        const extend_code = store?.query?.extend_code;
        if(!extend_code) {
            return;
        }
        const rule = getExtendRule(extend_code)
        return rule
    });
    let config = generateGameConfig(player_count());
    const extend = extend_rule();
    if(extend?.onNight) {
        extend.onNight(config, (new_config) => {
            config = new_config;
        });
    }
    const [game_stage_store, setGameStageStore] = createStore<GameStageStore>({
        config: config,
        stage: 'task',
        extendRule: extend_rule(),
        updateStage: (stage) => {
            setGameStageStore(produce(prev => {
                prev.stage = stage;
            }))
        },
        updateConfig: (config) => {
            setGameStageStore(produce(prev => {
                prev.config = config
            }))
        }
    });

    const onMenuClick:SelectCallback = (key) => {
        if(key === 'return_home') {
            store?.updateCurrent('game_home');
        }
    }
    const onNightEnd = () => {
        toast('游戏开始！');
        game_stage_store.updateStage('task');
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
                        <GameNight onDone={onNightEnd}/>
                    </Match>
                    <Match when={game_stage_store.stage === 'task'}>
                        <GameTask />
                    </Match>
                </Switch>
            </GameStageContainer>
        </GameStageContext.Provider>
    )
}