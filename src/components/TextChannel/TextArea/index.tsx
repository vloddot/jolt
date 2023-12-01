import ClientContext from '@lib/context/Client';
import { useContext, type JSX, onMount, onCleanup } from 'solid-js';
import styles from './index.module.scss';
import { SelectedChannelContext } from '@lib/context/SelectedChannel';
import util from '@lib/util';

export interface Props {
	initialValue?: string;
	placeholder?: string;
	sendTypingIndicators: boolean;
	ref?: (el: HTMLTextAreaElement) => void;
	onKeyDown?: JSX.EventHandler<HTMLTextAreaElement, KeyboardEvent>;
	onInput?: JSX.EventHandler<HTMLTextAreaElement, InputEvent>;
}

export default function TextArea(props: Props) {
	const channel = useContext(SelectedChannelContext)!;
	const client = useContext(ClientContext);
	let value = '';

	let ref: HTMLTextAreaElement;

	function focus() {
		ref.focus();

		// don't ask me my code is weird
		setTimeout(() => ref.selectionStart = ref.selectionEnd = ref.value.length, 1);
	}

	const onKeyDown: GlobalEventHandlers['onkeydown'] = (event) => {
		if (
			(event.ctrlKey && event.key != 'v') ||
			// alt key and meta key
			event.altKey ||
			event.metaKey ||
			event.key.length != 1 ||
			// if any other input element is active, do *not* focus
			util.inputSelected()
		) {
			return;
		}

		focus();
	};

	onMount(() => {
		focus();
		document.addEventListener('keydown', onKeyDown);

		onCleanup(() => {
			document.removeEventListener('keydown', onKeyDown);
		});
	});

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
			ref={(r) => {
				props.ref?.(r);
				ref = r;
			}}
			onInput={(event) => {
				beginTyping();
				value = event.currentTarget.value;
				props.onInput?.(event);
			}}
			onKeyDown={(event) => {
				props.onKeyDown?.(event);
			}}
			autofocus
			value={props.initialValue ?? ''}
			maxLength="2000"
			placeholder={props.placeholder}
		/>
	);
}
