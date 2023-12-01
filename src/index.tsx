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

render(
	() => (
		<SessionProvider>
			<Router base={import.meta.env.BASE_URL}>
				<Routes>
					<Route path="/" component={AppWrapper}>
						<Route path="/servers/:sid" component={ServerWrapper}>
							<Route path="/" component={ChannelMatcher} />
							<Route path="/channels/:cid" component={TextChannel} />
						</Route>
						<Route path="/" component={HomeWrapper}>
							<Route path="/" component={HomeScreen} />
							<Route path="/friends" component={Friends} />
							<Route path="/conversations/:cid" component={TextChannel} />
						</Route>
					</Route>
					<Route path="/login" component={Login} />
				</Routes>
			</Router>
		</SessionProvider>
	),
	document.getElementById('root')!
);
