import styles from './index.module.scss';
import { splitProps, type JSX } from 'solid-js';
import Setting from '..';

export type Props = {
	title: string;
	description: string;
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export default function InputSetting(props: Props) {
	const [settingsProps, inputProps] = splitProps(props, ['title', 'description']);

	return (
		<Setting {...settingsProps} cursor="default" labelStyle={{ 'min-width': '320px' }}>
			<input class={styles.settingsInput} {...inputProps} />
		</Setting>
	);
}
