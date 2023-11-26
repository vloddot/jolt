import styles from './index.module.scss';
import utilStyles from '@lib/util.module.scss';
import util from '@lib/util';
import { Show, createMemo, mergeProps } from 'solid-js';
import { AiFillFileText, AiOutlineDownload } from 'solid-icons/ai';
import { RiSystemExternalLinkFill } from 'solid-icons/ri';

export interface Props {
	attachment: AutumnFile;
	href: string;
	showLinkButton?: boolean;
	width?: string;
}

export default function FileAttachment(_props: Props) {
	const props = mergeProps({ showLinkButton: false, width: '400px' }, _props);
	const formattedSize = createMemo(() => util.formatSize(props.attachment.size));

	return (
		<div class={styles.fileAttachment} style={{ width: props.width }}>
			<AiFillFileText size={25} />
			<div class={styles.metadata}>
				<span>{props.attachment.filename}</span>
				<span class={styles.fileSize}>{formattedSize()}</span>
			</div>

			<div class={utilStyles.flexDivider} />

			<Show when={props.showLinkButton}>
				<a href={props.href} target="_blank" rel="noreferrer" class={styles.iconButton}>
					<RiSystemExternalLinkFill size={25} />
				</a>
			</Show>

			<a href={props.href} download target="_blank" rel="noreferrer" class={styles.iconButton}>
				<AiOutlineDownload size={25} />
			</a>
		</div>
	);
}
