import ClientContext from '@lib/context/client';
import { useContext, type JSX } from 'solid-js';
import { ChannelContext } from '../context/channel';
import styles from './index.module.scss';

export interface Props {
	placeholder?: string;
	sendTypingIndicators: boolean;
	onKeyDown?: JSX.EventHandler<HTMLTextAreaElement, KeyboardEvent>;
	ref: HTMLTextAreaElement;
}

export default function TextAreaBase(props: Props) {
	const channel = useContext(ChannelContext)!;
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
			}}
			onKeyDown={(event) => {
				props.onKeyDown?.(event);
				endTyping();
			}}
			maxLength="2000"
			placeholder={props.placeholder}
		/>
	);
}
