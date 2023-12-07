import { Show, type JSX } from 'solid-js';
import styles from './index.module.scss';

export interface Props {
	onClick: JSX.EventHandler<HTMLDivElement, MouseEvent>;
	src: string | JSX.Element;
	name: string;
	selected: boolean;
}

export default function AutocompleteItem(props: Props) {
	return (
		<div
			data-selected={props.selected}
			onClick={(event) => props.onClick(event)}
			class={styles.autocompleteItem}
		>
			<Show when={typeof props.src == 'string' && props.src} fallback={props.src}>
				{(src) => <img style={{ width: '24px', height: '24px' }} src={src()} />}
			</Show>
			{props.name}
		</div>
	);
}
