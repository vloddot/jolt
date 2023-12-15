import { render } from 'solid-js/web';
import { Route, Router, Routes } from '@solidjs/router';

import './index.scss';
import AppWrapper from './pages/(app)/layout';
import HomeWrapper from './pages/(app)/(home)/layout';
import HomeScreen from './pages/(app)/(home)/page';
import Login from './pages/Login';
import Friends from './pages/(app)/(home)/friends/page';
import ServerWrapper from './pages/(app)/servers/:sid/layout';
import ChannelMatcher from './pages/(app)/servers/:sid/page';
import SessionProvider from '@lib/context/Session';
import TextChannel from '@components/TextChannel';
import SettingsWrapper from './pages/(app)/(settings)/layout';
import SettingsAppearance from './pages/(app)/(settings)/settings/appearance/page';
import SettingsBehavior from './pages/(app)/(settings)/settings/behavior/page';
import SettingsInstance from './pages/(app)/(settings)/settings/instance/page';
import SettingsMatcher from './pages/(app)/(settings)/settings/page';
import UserSettingsMatcher from './pages/(app)/(settings)/user/page';
import UserProfileSettings from './pages/(app)/(settings)/user/profile/page';

render(
	() => (
		<Router base={import.meta.env.BASE_URL}>
			<SessionProvider>
				<Routes>
					<Route path="/" component={AppWrapper}>
						<Route path="/servers/:sid" component={ServerWrapper}>
							<Route path="/" component={ChannelMatcher} />
							<Route path="/channels/:cid" component={TextChannel} />
						</Route>
						<Route path="/" component={SettingsWrapper}>
							<Route path="/settings">
								<Route path="/" component={SettingsMatcher} />
								<Route path="/appearance" component={SettingsAppearance} />
								<Route path="/behavior" component={SettingsBehavior} />
								<Route path="/instance" component={SettingsInstance} />
							</Route>
							<Route path="/user">
								<Route path="/" component={UserSettingsMatcher} />
								<Route path="/profile" component={UserProfileSettings} />
							</Route>
						</Route>
						<Route path="/" component={HomeWrapper}>
							<Route path="/" component={HomeScreen} />
							<Route path="/friends" component={Friends} />
							<Route path="/conversations/:cid" component={TextChannel} />
						</Route>
					</Route>
					<Route path="/login" component={Login} />
				</Routes>
			</SessionProvider>
		</Router>
	),
	document.getElementById('root')!
);
