import ClientContext from '@lib/context/Client';
import { useContext, type JSX } from 'solid-js';
import styles from './index.module.scss';
import { SelectedChannelContext } from '@lib/context/SelectedChannel';

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
		const c = channel()?._id;
		if (!props.sendTypingIndicators || c == undefined) {
			return;
		}

		client.send({ type: 'EndTyping', channel: c });
	}

	function beginTyping() {
		const c = channel()?._id;
		if (!props.sendTypingIndicators || c == undefined) {
			return;
		}

		if (value.trim() == '') {
			endTyping();
			return;
		}

		client.send({ type: 'BeginTyping', channel: c });
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
