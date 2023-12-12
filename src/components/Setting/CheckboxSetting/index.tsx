import styles from './index.module.scss';
import { splitProps, type JSX } from 'solid-js';
import { IoCheckmarkSharp } from 'solid-icons/io';
import Setting from '..';

export type Props = {
	title: string;
	description: string;
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export default function CheckboxSetting(props: Props) {
	const [settingsProps, inputProps] = splitProps(props, ['title', 'description']);

	return (
		<Setting {...settingsProps} labelStyle={{ flex: 1 }}>
			<input
				checked={/* @once */ inputProps.checked}
				style={{ display: 'none' }}
				type="checkbox"
				{...inputProps}
			/>

			<div aria-checked={inputProps.checked} class={styles.checkmark}>
				<IoCheckmarkSharp />
			</div>
		</Setting>
	);
}
