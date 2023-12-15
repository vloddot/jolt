import styles from './index.module.scss';
import type { JSX } from 'solid-js';

export interface SettingsProps {
	title: string;
	description: string;
	cursor?: JSX.CSSProperties['cursor'];
	labelStyle?: JSX.CSSProperties;
	class?: string;
	children: JSX.Element;
}

export default function GenericSetting(props: SettingsProps) {
	return (
		<div class={styles.settingBase} style={{ cursor: props.cursor }}>
			<label
				for="setting-content"
				class={styles.settingBase}
				style={{ cursor: props.cursor, ...props.labelStyle }}
			>
				<div>
					<span class={styles.title}>{props.title}</span>
					<p class={styles.description}>{props.description}</p>
				</div>
			</label>
			<span class={props.class} id="setting-content">
				{props.children}
			</span>
		</div>
	);
}
