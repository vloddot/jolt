import { Navigate } from '@solidjs/router';
import userSettingsSections from './sections';

export default function UserSettingsMatcher() {
	return <Navigate href={`/user/${userSettingsSections[0].id}`} />;
}
