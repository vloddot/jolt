import utilStyles from '@lib/util.module.scss';
import styles from './index.module.scss';
import { splitProps, type JSX } from 'solid-js';
import { IoCheckmarkSharp } from 'solid-icons/io';

export type Props = {
	title: string;
	description: string;
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export default function CheckboxSetting(props: Props) {
	const [settingsProps, inputProps] = splitProps(props, ['title', 'description']);

	return (
		<label class={styles.checkboxSettingBase}>
			<div class={utilStyles.flexDivider}>
				<span class={styles.title}>{settingsProps.title}</span>
				<p class={styles.description}>{settingsProps.description}</p>
			</div>

			<input checked={/* @once */ props.checked} type="checkbox" {...inputProps} />

			<div aria-checked={props.checked} class={styles.checkmark}>
				<IoCheckmarkSharp />
			</div>
		</label>
	);
}
