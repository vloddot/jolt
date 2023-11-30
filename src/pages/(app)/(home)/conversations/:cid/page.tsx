import TextChannel from '@components/TextChannel';
import { SelectedChannelContext } from '@lib/context/selectedChannel';
import { Show, useContext } from 'solid-js';

export default function Conversation() {
	const selectedChannel = useContext(SelectedChannelContext);

	return (
		<main class="main-content-container">
			<Show when={selectedChannel() != undefined && selectedChannel()}>
				{(channel) => {
					return (
						<Show
							when={
								channel().channel_type != 'VoiceChannel' &&
								(channel() as Exclude<Channel, { channel_type: 'VoiceChannel' }>)
							}
							fallback={<p>Voice channels are not currently supported at the moment.</p>}
						>
							{(channel) => <TextChannel channel={channel()} />}
						</Show>
					);
				}}
			</Show>
		</main>
	);
}
