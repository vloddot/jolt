import ClientContext from '@lib/context/client';
import { useContext, type JSX } from 'solid-js';
import { SelectedChannelContext } from '../context/channel';
import styles from './index.module.scss';

export interface Props {
	initialValue?: string;
	placeholder?: string;
	sendTypingIndicators: boolean;
	onKeyDown?: JSX.EventHandler<HTMLTextAreaElement, KeyboardEvent>;
	onInput?: JSX.EventHandler<HTMLTextAreaElement, InputEvent>;
	ref?: HTMLTextAreaElement | ((e: HTMLTextAreaElement) => void);
}

export default function TextArea(props: Props) {
	const channel = useContext(SelectedChannelContext)!;
	const client = useContext(ClientContext);
	let value = '';

	function endTyping() {
		if (!props.sendTypingIndicators || channel == undefined) {
			return;
		}

		client.send({ type: 'EndTyping', channel: channel._id });
	}

	function beginTyping() {
		if (!props.sendTypingIndicators || channel == undefined) {
			return;
		}

		if (value.trim() == '') {
			endTyping();
			return;
		}

		client.send({ type: 'BeginTyping', channel: channel._id });
	}

	return (
		<textarea
			class={styles.textareaBase}
			onBlur={endTyping}
			ref={props.ref}
			onInput={(event) => {
				beginTyping();
				value = event.currentTarget.value;
				props.onInput?.(event);
			}}
			onKeyDown={(event) => {
				props.onKeyDown?.(event);
				endTyping();
			}}
			autofocus
			value={props.initialValue ?? ''}
			maxLength="2000"
			placeholder={props.placeholder}
		/>
	);
}
