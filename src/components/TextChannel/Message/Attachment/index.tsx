import util from '@lib/util';
import styles from './index.module.scss';
import { Match, Switch, createMemo, createResource } from 'solid-js';
import FileAttachment from './FileAttachment';

export default function Attachment(attachment: AutumnFile) {
	const href = createMemo(() => util.getAutumnURL(attachment));

	return (
		<Switch>
			<Match when={attachment.metadata.type == 'Image'}>
				<img class={styles.mediaAttachment} src={href()} alt={attachment.filename} />
			</Match>
			<Match when={attachment.metadata.type == 'Video'}>
				<video class={styles.mediaAttachment} controls>
					<source src={href()} />
				</video>
			</Match>
			<Match when={attachment.metadata.type == 'Audio'}>
				<audio class={styles.mediaAttachment} controls>
					<source src={href()} />
				</audio>
			</Match>
			<Match when={attachment.metadata.type == 'File' && attachment}>
				{(attachment) => <FileAttachment attachment={attachment()} href={href()} />}
			</Match>
			<Match when={attachment.metadata.type == 'Text' && attachment}>
				{(attachment) => {
					const [text] = createResource(href, (href) =>
						fetch(href).then((response) => response.text())
					);

					return (
						<div class={styles.textAttachment}>
							<div class={styles.textContent}>
								<Switch>
									<Match when={text.state == 'ready' && text()}>{(text) => text()}</Match>
								</Switch>
							</div>
							<FileAttachment attachment={attachment()} showLinkButton href={href()} width="100%" />
						</div>
					);
				}}
			</Match>
		</Switch>
	);
}