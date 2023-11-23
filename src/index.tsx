import { render } from 'solid-js/web';
import { Route, Router, Routes } from '@solidjs/router';

import './index.scss';
import SessionProvider from '@lib/context/session';
import AppWrapper from './pages/(app)/layout';
import HomeWrapper from './pages/(app)/(home)/layout';
import HomeScreen from './pages/(app)/(home)/page';
import Conversation from './pages/(app)/(home)/conversations/:cid/page';
import Login from './pages/Login';
import Friends from './pages/(app)/(home)/friends/page';
import ServerChannel from './pages/(app)/servers/:sid/channels/:cid/page';
import ServerWrapper from './pages/(app)/servers/:sid/layout';
import ChannelMatcher from './pages/(app)/servers/:sid/page';

render(
	() => (
		<Router>
			<SessionProvider>
				<Routes>
					<Route path="/" component={AppWrapper}>
						<Route path="/servers/:sid" component={ServerWrapper}>
							<Route path="/" component={ChannelMatcher} />
							<Route path="/channels/:cid" component={ServerChannel} />
						</Route>
						<Route path="/" component={HomeWrapper}>
							<Route path="/" component={HomeScreen} />
							<Route path="/friends" component={Friends} />
							<Route path="/conversations/:cid" component={Conversation} />
						</Route>
					</Route>
					<Route path="/login" component={Login} />
				</Routes>
			</SessionProvider>
		</Router>
	),
	document.getElementById('root')!
);
