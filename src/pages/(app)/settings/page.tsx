import { Navigate } from '@solidjs/router';
import settingsSections from './sections';

export default function SettingsMatcher() {
	return <Navigate href={`/settings/${settingsSections[0].id}`} />;
}
