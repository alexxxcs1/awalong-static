import { JSXElement } from "solid-js";
import { render } from "solid-js/web";
import { styled } from "solid-styled-components"

const Mask = styled.div({
    background: '#00000033',
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
});

export const openModal = (child: (close:() => void) => JSXElement) => {
    const modal_element_container = document.createElement('div');
    const generate_id = ['modal',Date.now().toString(16), (Math.round((Math.random() * 1000))).toString(16)].join('-');
    modal_element_container.id = generate_id;
    document.body.appendChild(modal_element_container);
    const remove = () => {
        modal_element_container.parentNode!.removeChild(modal_element_container);
    }
    const element = (
        <Mask>
            {child(remove)}
        </Mask>
    )
    render(() => element, modal_element_container);
}