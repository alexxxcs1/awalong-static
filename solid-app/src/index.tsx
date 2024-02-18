
import { Component } from "solid-js";
import { render } from "solid-js/web";
import { createGlobalStyles, css, styled } from "solid-styled-components";
import { HomeView } from "./views/home";
import { GameAppController } from "./game.controller";

const Container = styled.div({
    width: '100%',
    height: '100%',
});

const GlobalStyled = createGlobalStyles({
    'html, body, #root': {
        // fontSize: '18px',
        margin: 0,
        padding: 0,
        width: '100%',
        height:'100%',
        overflow: 'hidden',
    }
});

const App:Component = () => {
    return (
        <Container>
            <GlobalStyled />
            <GameAppController />
        </Container>
    )
}

render(() => <App />, document.querySelector('#root')!);