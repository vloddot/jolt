import TextChannel from '@components/TextChannel';
import { SelectedChannelContext } from '@lib/context/selectedChannel';
import { Navigate } from '@solidjs/router';
import { Match, Show, Switch, useContext } from 'solid-js';
import { SelectedServerContext } from '../../context';

export default function ServerChannel() {
	const selectedChannel = useContext(SelectedChannelContext);
	const selectedServer = useContext(SelectedServerContext);

	return (
		<main class="main-content-container">
			<Show when={selectedChannel() != undefined && selectedChannel()}>
				{(channel) => {
					return (
						<Switch fallback={<Navigate href={`/conversations/${channel()._id}`} />}>
							<Match when={channel().channel_type == 'VoiceChannel'}>
								<p>Voice channels are not supported at the moment.</p>
							</Match>
							<Match
								when={
									channel().channel_type == 'TextChannel' &&
									(channel() as Extract<Channel, { channel_type: 'TextChannel' }>)
								}
							>
								{(channel) => <TextChannel channel={channel()} server={selectedServer} />}
							</Match>
						</Switch>
					);
				}}
			</Show>
		</main>
	);
}
