import styles from './index.module.scss';
import { SettingsContext } from '@lib/context/Settings';
import { createMemo, useContext } from 'solid-js';

export interface Props {
	overrideKey: keyof Settings['appearance:theme:overrides'];
}

export default function ThemeOverride(props: Props) {
	const { settings, setSettings } = useContext(SettingsContext);

	const bg = createMemo(() => settings['appearance:theme:overrides'][props.overrideKey]);

	return (
		<div class={styles.themeContainer} style={{ 'background-color': bg() }}>
			<h1>{props.overrideKey[0].toUpperCase() + props.overrideKey.slice(1)}</h1>
			<input
				value={bg()}
				onInput={(event) =>
					setSettings('appearance:theme:overrides', props.overrideKey, event.currentTarget.value)
				}
			/>
		</div>
	);
}
