import styles from './index.module.scss';
import { Show, type JSX } from 'solid-js';
import util from '@lib/util';

export interface Props {
	children: JSX.Element;
	overlay?: JSX.Element;
	metadata?: {
		name: string;
		size: number;
	};
	action(): unknown;
}

export default function AttachmentPreviewItem(props: Props) {
	return (
		<div class={styles.attachmentPreviewItem}>
			<button class={styles.attachmentIcon} onClick={() => props.action()}>
				{props.children}
				<Show when={props.overlay}>
					{(overlay) => (
						<div class={styles.attachmentOverlay}>
							{overlay()}
						</div>
					)}
				</Show>
			</button>
			<Show when={props.metadata}>
				{(metadata) => (
					<>
						<div class={styles.attachmentName}>{metadata().name}</div>
						<div class={styles.attachmentSize}>{util.formatSize(metadata().size)}</div>
					</>
				)}
			</Show>
		</div>
	);
}
