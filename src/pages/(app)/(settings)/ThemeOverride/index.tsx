import styles from './index.module.scss';
import { SettingsContext } from '@lib/context/Settings';
import util from '@lib/util';
import { createMemo, useContext } from 'solid-js';

export interface Props {
	overrideKey: keyof Settings['appearance:theme:overrides'];
}

export default function ThemeOverride(props: Props) {
	const { settings, setSettings } = useContext(SettingsContext);

	const bg = createMemo(() => settings['appearance:theme:overrides'][props.overrideKey]);
	const fg = createMemo(() =>
		util.getContrastingColor(bg(), settings['appearance:theme:overrides']['primary-background'])
	);

	return (
		<div class={styles.themeContainer} style={{ 'background-color': bg() }}>
			<h1 style={{ color: fg() }}>
				{props.overrideKey[0].toUpperCase() + props.overrideKey.slice(1)}
			</h1>
			<input
				value={bg()}
				onInput={(event) =>
					setSettings('appearance:theme:overrides', props.overrideKey, event.currentTarget.value)
				}
			/>
		</div>
	);
}
