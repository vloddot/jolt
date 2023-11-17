import { render } from 'solid-js/web';
import { Route, Router, Routes } from '@solidjs/router';

import './index.scss';
import SessionProvider from '@lib/context/session';
import AppWrapper from './pages/(app)/layout';
import HomeWrapper from './pages/(app)/(home)/layout';
import HomeScreen from './pages/(app)/(home)/page';
import HomeChat from './pages/(app)/(home)/conversations/:cid/page';
import Login from './pages/Login';

render(
	() => (
		<Router>
			<SessionProvider>
				<Routes>
					<Route path="/" component={AppWrapper}>
						<Route path="/" component={HomeWrapper}>
							<Route path="/" component={HomeScreen}></Route>
							<Route path="/conversations/:cid" component={HomeChat}></Route>
						</Route>
					</Route>
					<Route path="/login" component={Login}></Route>
				</Routes>
			</SessionProvider>
		</Router>
	),
	document.getElementById('root')!
);
