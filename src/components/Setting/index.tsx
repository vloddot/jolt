import styles from './index.module.scss';
import type { JSX } from 'solid-js';

export interface SettingsProps {
	title: string;
	description: string;
	cursor?: JSX.CSSProperties['cursor'];
	labelStyle?: JSX.CSSProperties;
	children: JSX.Element;
}

export default function Setting(props: SettingsProps) {
	return (
		<label class={styles.settingBase} style={{ cursor: props.cursor }}>
			<div style={props.labelStyle}>
				<span class={styles.title}>{props.title}</span>
				<p class={styles.description}>{props.description}</p>
			</div>

			{props.children}
		</label>
	);
}
