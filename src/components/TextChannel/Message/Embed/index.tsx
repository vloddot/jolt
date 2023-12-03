import Markdown from '@components/Markdown';
import styles from './index.module.scss';
import { Match, Show, Switch } from 'solid-js';

export default function Embed(embed: Embed) {
	return (
		<Switch>
			<Match when={embed.type == 'Image' && embed}>
				{(embed) => <img src={embed().url} width={embed().width} height={embed().height} />}
			</Match>
			<Match when={embed.type == 'Text' && embed}>
				{(embed) => (
					<div
						class={styles.textEmbed}
						style={{ 'border-left': `solid ${embed().colour ?? 'var(--tertiary-background)'}` }}
					>
						<div class={styles.heading}>
							<Show when={embed().icon_url}>
								{(url) => (
									<img
										class={styles.icon}
										src={url()}
										alt={embed().title ?? 'Icon'}
										width="24px"
										height="24px"
									/>
								)}
							</Show>
							<Show when={embed().title}>
								{(title) => <div class={styles.title}>{title()}</div>}
							</Show>
						</div>
						<Show when={embed().description}>
							{(description) => <Markdown>{description()}</Markdown>}
						</Show>
					</div>
				)}
			</Match>
		</Switch>
	);
}
