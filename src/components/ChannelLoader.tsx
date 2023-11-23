import api from '@lib/api';
import { SessionContext } from '@lib/context/session';
import {
	useContext,
	type Accessor,
	type Component,
	createResource,
	Switch,
	Match,
	type JSX
} from 'solid-js';
import styles from '@lib/util.module.scss';

export interface Props {
	id: string;
	children: JSX.Element | Component<Accessor<Channel>>;
}

export default function ChannelLoader(props: Props) {
	const [session] = useContext(SessionContext);
	const [channel, { refetch }] = createResource(
		() => session() != null && props.id,
		api.fetchChannel
	);

	return (
		<Switch>
			<Match when={channel.state == 'pending'}>
				<p>Loading channel...</p>
			</Match>
			<Match when={channel.state == 'errored'}>
				<p>Oh noes! {channel.error}</p>
				<button class={styles.buttonPrimary} onClick={refetch}>
					Reload
				</button>
			</Match>
			<Match when={channel.state == 'refreshing'}>
				<p>Reloading...</p>
			</Match>
			<Match when={channel.state == 'unresolved'}>
				<p>Unresolved channel.</p>
			</Match>
			<Match when={channel.state == 'ready' && channel()}>{props.children}</Match>
		</Switch>
	);
}
