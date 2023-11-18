import TextChat from '@components/TextChannel';
import api from '@lib/api';
import { SelectedChannelIdContext } from '@lib/context/selectedChannelId';
import { SessionContext } from '@lib/context/session';
import { Navigate } from '@solidjs/router';
import { Match, Show, Switch, createResource, useContext } from 'solid-js';

export default function HomeChat() {
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const [session] = useContext(SessionContext);

	const [channel] = createResource(
		() => (session() != null ? selectedChannelId() : false),
		api.fetchChannel
	);

	return (
		<main class="main-content-container">
			<Show
				when={channel.state == 'ready' ? channel() : false}
				fallback={
					<p>
						<Switch>
							<Match when={channel.state == 'pending'}>Loading channel...</Match>
							<Match when={channel.state == 'errored'}>Oh noes! {channel.error}</Match>
							<Match when={channel.state == 'refreshing'}>Reloading...</Match>
							<Match when={channel.state == 'unresolved'}>Unresolved channel.</Match>
						</Switch>
					</p>
				}
			>
				{(channelAcessor) => {
					const channel = channelAcessor();

					if (channel.channel_type == 'TextChannel' || channel.channel_type == 'VoiceChannel') {
						return <Navigate href={`/servers/${channel.server}/channels/${channel._id}`} />;
					}

					return <TextChat channel={channel} />;
				}}
			</Show>
		</main>
	);
}
