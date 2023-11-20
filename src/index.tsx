import { render } from 'solid-js/web';
import { Route, Router, Routes } from '@solidjs/router';

import './index.scss';
import SessionProvider from '@lib/context/session';
import AppWrapper from './pages/(app)/layout';
import HomeWrapper from './pages/(app)/(home)/layout';
import HomeScreen from './pages/(app)/(home)/page';
import HomeChat from './pages/(app)/(home)/conversations/:cid/HomeChat';
import Login from './pages/Login';
import Friends from './pages/(app)/(home)/friends/page';

render(
	() => (
		<Router>
			<SessionProvider>
				<Routes>
					<Route path="/" component={AppWrapper}>
						<Route path="/" component={HomeWrapper}>
							<Route path="/" component={HomeScreen} />
							<Route path="/friends" component={Friends} />
							<Route path="/conversations/:cid" component={HomeChat} />
						</Route>
					</Route>
					<Route path="/login" component={Login} />
				</Routes>
			</SessionProvider>
		</Router>
	),
	document.getElementById('root')!
);
