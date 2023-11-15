import { createContext, createEffect, createSignal, useContext, type JSX, onMount } from 'solid-js';
import ClientContext from './client';

export const SessionContext = createContext(createSignal<Session>());

export interface Props {
	children: JSX.Element;
}

export default function SessionProvider(props: Props) {
	const [session, setSession] = createSignal<Session>();
	const client = useContext(ClientContext);

	createEffect(() => {
		const { token } = session() ?? { token: undefined };
		if (token != undefined) {
			client.authenticate(token);
		}
	});

	onMount(() => {
		const session = localStorage.getItem('session');
		if (session != null) {
			setSession(JSON.parse(session));
		}
	});

	return (
		<SessionContext.Provider value={[session, setSession]}>
			{props.children}
		</SessionContext.Provider>
	);
}
