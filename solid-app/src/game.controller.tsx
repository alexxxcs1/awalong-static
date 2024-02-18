
import { Match, Switch, createContext, createMemo, createSignal } from "solid-js"
import { HomeView } from "./views/home";
import { GameStageControllerView } from "./views/game-view/game";
import { createStore, produce } from "solid-js/store";

type ViewNames = 'game_home' | 'game_stage'
type ViewControllerStore = {
    current: ViewNames,
    query?: Record<string, string>
    updateCurrent: (view_name: ViewNames  | `${ViewNames}?${string}`) => void
}
export const GameAppControllerContext = createContext<ViewControllerStore>();
export const GameAppController = () => {
    const [view_store, updateStore] = createStore<ViewControllerStore>({
        current: 'game_home',
        updateCurrent: (view) => {
            const [view_name] = view.match(/[^\?]+/) || [];
            if(!view_name) return;
            const view_query = view.replace(view_name, '').replace(/^\?/, '');
            const querys = view_query.split('&');
            const querys_obj = querys.reduce<NonNullable<ViewControllerStore['query']>>((result, content) => {
                const [key, value] = content.split('=');
                if(!key) return result;
                result[key] = value || '';
                return result;
            }, {});
            console.log(view, 'view');
            updateStore(produce((prev) => {
                prev.current = view_name as ViewNames;
                if(view_query) {
                    prev.query = querys_obj
                }
            }))
        }
    });
    return (
        <GameAppControllerContext.Provider value={view_store}>
            <Switch>
                <Match when={view_store.current === 'game_home'}>
                    <HomeView />
                </Match>
                <Match when={view_store.current === 'game_stage'}>
                    <GameStageControllerView />
                </Match>
            </Switch>
        </GameAppControllerContext.Provider>
    )
}