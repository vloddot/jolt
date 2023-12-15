import { BiSolidPaint } from 'solid-icons/bi';
import { FaSolidUserGear } from 'solid-icons/fa';
import { TbUserCog } from 'solid-icons/tb';

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
	},
	{
		title: 'Instance',
		id: 'instance',
		icon: FaSolidUserGear
	}
];

export default settingsSections;
