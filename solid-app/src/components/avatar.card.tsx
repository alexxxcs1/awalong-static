import { Component, JSXElement, Show, createMemo } from "solid-js";
import { styled } from "solid-styled-components";
import { Card } from "solid-bootstrap";
import { AvatarType } from "../utils/avatars";

const CardContent = styled.div<{type: AvatarType['type']}>((props) => {
    const main_color = props.type === 'protagonist' ? '#198754' : '#dc3545';
    return {
        padding: '.4rem',
        '.card': {
            border: 'none !important',
            '.name': {
                fontSize: '2rem',
            },
            '.camp': {
                color: main_color,
                marginLeft: '.4rem',
                fontSize: '1.5rem'
            }
        },
    }
});
export const AvatarCard:Component<{data: AvatarType, extend?: () => JSXElement}> = (props) => {
    const name = createMemo(() => {
        return props.data.name;
    });
    const avatar_asset = createMemo(() => {
        return props.data.asset
    });
    const skill = createMemo(() => {
        const no_skill = '你是一个白板，什么也不知道，看身份的时候记得装作看的很认真的样子'
        return props.data.skill || no_skill;
    });
    const camp = createMemo(() => {
        const type = props.data.type;
        if(type === 'protagonist') return '绿色阵营'
        if(type === 'villain') return '红色阵营'
    })
    return (
        <CardContent type={props.data.type}>
            <Card >
                <Card.Img variant="top" src={avatar_asset()} />
                <Card.Body>
                    <Card.Title>
                        <span class="name">{name()}</span> 
                        <span class="camp">{camp()}</span>
                    </Card.Title>
                    <Card.Text>
                        {skill()}
                    </Card.Text>
                    <Show when={props.extend}>
                        {
                            props.extend!()
                        }
                    </Show>
                </Card.Body>
            </Card>
        </CardContent>
    )
}