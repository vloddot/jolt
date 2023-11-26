import ChannelLoader from '@components/ChannelLoader';
import TextChannel from '@components/TextChannel';
import { SelectedChannelIdContext } from '@lib/context/selectedChannelId';
import { useNavigate } from '@solidjs/router';
import { Match, Show, Switch, createEffect, useContext } from 'solid-js';

export default function Conversation() {
	const selectedChannelId = useContext(SelectedChannelIdContext);

	return (
		<main class="main-content-container">
			<Show when={selectedChannelId() != undefined && selectedChannelId()}>
				{(id) => (
					<ChannelLoader id={id()}>
						{(channel) => {
							const navigate = useNavigate();

							createEffect(() => {
								const c = channel();
								if (c.channel_type == 'TextChannel' || c.channel_type == 'VoiceChannel') {
									navigate(`/servers/${c.server}/channels/${c._id}`);
								}
							});

							return (
								<Switch>
									<Match when={channel().channel_type == 'VoiceChannel'}>
										<p>Voice channels are not currently supported at the moment.</p>
									</Match>
									<Match
										when={
											channel().channel_type != 'VoiceChannel' &&
											(channel() as Exclude<Channel, { channel_type: 'VoiceChannel' }>)
										}
									>
										{(channel) => <TextChannel channel={channel()} />}
									</Match>
								</Switch>
							);
						}}
					</ChannelLoader>
				)}
			</Show>
		</main>
	);
}
