import type { IconTypes } from 'solid-icons';
import { BiSolidPaint } from 'solid-icons/bi';

export interface SettingsSection {
	title: string;
	icon: IconTypes;
	id: string;
}

const settingsSections: SettingsSection[] = [
	{
		title: 'Appearance',
		id: 'appearance',
		icon: BiSolidPaint
	}
];

export default settingsSections;
