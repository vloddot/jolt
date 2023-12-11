import type { IconTypes } from 'solid-icons';
import { BiSolidPaint } from 'solid-icons/bi';
import { TbUserCog } from 'solid-icons/tb';

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
	},
	{
		title: 'Behavior',
		id: 'behavior',
		icon: TbUserCog
	}
];

export default settingsSections;
