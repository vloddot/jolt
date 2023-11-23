import api from '@lib/api';
import { SessionContext } from '@lib/context/session';
import {
	createResource,
	type Component,
	type Accessor,
	useContext,
	Switch,
	Match,
	type JSX
} from 'solid-js';
import styles from '@lib/util.module.scss';

export interface Props {
	id: string;
	children: JSX.Element | Component<Accessor<Server>>;
}

export default function ServerLoader(props: Props) {
	const [session] = useContext(SessionContext);

	const [server, { refetch }] = createResource(
		() => session() != null && props.id,
		api.fetchServer
	);

	return (
		<Switch>
			<Match when={server.state == 'pending'}>
				<p>Loading server...</p>
			</Match>
			<Match when={server.state == 'errored'}>
				<p>Oh noes! {server.error}</p>
				<button class={styles.buttonPrimary} onClick={refetch}>
					Reload
				</button>
			</Match>
			<Match when={server.state == 'refreshing'}>
				<p>Reloading...</p>
			</Match>
			<Match when={server.state == 'unresolved'}>
				<p>Unresolved server.</p>
			</Match>
			<Match when={server.state == 'ready' && server()}>{props.children}</Match>
		</Switch>
	);
}
