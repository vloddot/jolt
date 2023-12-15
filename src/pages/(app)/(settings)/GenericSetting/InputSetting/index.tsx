import styles from './index.module.scss';
import { splitProps, type JSX } from 'solid-js';
import GenericSetting from '..';

export type Props = {
	title: string;
	description: string;
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export default function InputSetting(props: Props) {
	const [settingsProps, inputProps] = splitProps(props, ['title', 'description']);

	return (
		<GenericSetting
			class={styles.settingsInput}
			{...settingsProps}
			cursor="default"
			labelStyle={{ 'min-width': '250px' }}
		>
			<input style={{ width: '100%' }} {...inputProps} />
		</GenericSetting>
	);
}
