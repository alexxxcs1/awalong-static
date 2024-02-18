import { Toast } from "solid-bootstrap"
import { Show } from "solid-js"
import { render } from "solid-js/web";
import { styled } from "solid-styled-components";

type ToastMessageOption = {
    header?: string,
    timeout?: number, //ms
}
const Wrapper = styled.div({
    position: 'fixed',
    top: '2rem',
    left: '50%',
    transform: 'translate(-50%, 0)'
})
export const toast = (message: string, opt?: ToastMessageOption) => {
    const toast_element_container = document.createElement('div');
    const generate_id = ['toast',Date.now().toString(16), (Math.round((Math.random() * 1000))).toString(16)].join('-');
    toast_element_container.id = generate_id;
    document.body.appendChild(toast_element_container);
    const element = (
        <Wrapper>
            <Toast>
                <Show when={!!opt?.header}>
                    <Toast.Header>
                        {opt?.header}
                    </Toast.Header>
                </Show>
                <Toast.Body>{message}</Toast.Body>
            </Toast>
        </Wrapper>
    );
    render(() => element, toast_element_container);
    setTimeout(() => {
        toast_element_container.parentNode!.removeChild(toast_element_container);
    }, opt?.timeout || 3000);
}