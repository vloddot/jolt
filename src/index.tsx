import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';

import './index.scss';
import App from './App';
import SessionProvider from '@lib/context/session';
import ClientContext from '@lib/context/client';
import Collections from '@lib/context/collections';

render(
	() => (
		<ClientContext.Provider value={ClientContext.defaultValue}>
			<SessionProvider>
				<Collections>
					<Router>
						<App />
					</Router>
				</Collections>
			</SessionProvider>
		</ClientContext.Provider>
	),
	document.getElementById('root')!
);
