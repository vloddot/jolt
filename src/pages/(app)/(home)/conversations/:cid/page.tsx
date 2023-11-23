import ChannelLoader from '@components/ChannelLoader';
import TextChannel from '@components/TextChannel';
import { SelectedChannelIdContext } from '@lib/context/selectedChannelId';
import { useNavigate } from '@solidjs/router';
import { Show, useContext } from 'solid-js';

export default function Conversation() {
	const selectedChannelId = useContext(SelectedChannelIdContext);

	return (
		<main class="main-content-container">
			<Show when={selectedChannelId() != undefined && selectedChannelId()}>
				{(channel_id) => (
					<ChannelLoader id={channel_id()}>
						{(channelAcessor) => {
							const channel = channelAcessor();
							const navigate = useNavigate();

							if (channel.channel_type == 'TextChannel' || channel.channel_type == 'VoiceChannel') {
								navigate(`/servers/${channel.server}`);
								return null;
							}

							return <TextChannel channel={channel} />;
						}}
					</ChannelLoader>
				)}
			</Show>
		</main>
	);
}
