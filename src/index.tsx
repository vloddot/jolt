import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';

import './index.scss';
import App from './App';
import { ClientProvider } from '@lib/context/client';

render(
	() => (
		<Router>
			<ClientProvider>
				<App />
			</ClientProvider>
		</Router>
	),
	document.getElementById('root')!
);
