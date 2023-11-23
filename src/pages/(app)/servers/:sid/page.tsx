import { Match, Switch, useContext } from 'solid-js';
import { SelectedServerContext } from './context';
import { Navigate } from '@solidjs/router';

export default function ChannelMatcher() {
	const server = useContext(SelectedServerContext);

	return (
		<main class="main-content-container">
			<Switch fallback={<p>welp this is awkward</p>}>
				<Match when={server?.channels.length == 0}>
					<p>there's like 0 channels in this server uhh</p>
				</Match>
				<Match when={server != undefined && server}>
					{(server) => (
						<Navigate href={`/servers/${server()._id}/channels/${server().channels[0]}`} />
					)}
				</Match>
			</Switch>
		</main>
	);
}
