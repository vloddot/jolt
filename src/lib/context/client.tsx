import { type JSX, createContext } from 'solid-js';
import { Client } from '@lib/client';
import { Navigate } from '@solidjs/router';

export const ClientContext = createContext(new Client());

export function ClientProvider(props: { children: JSX.Element }) {
	const client = new Client();

	const session = localStorage.getItem('session');
	if (session == null) {
		return <Navigate href="/login" />;
	}

	client.authenticate(JSON.parse(session));

	return <ClientContext.Provider value={client}>{props.children}</ClientContext.Provider>;
}
