import TextChannel from '@components/TextChannel';
import { SelectedChannelContext } from '@lib/context/selectedChannel';
import { Show, useContext } from 'solid-js';
import { SelectedServerContext } from '../../context';

export default function ServerChannel() {
	const selectedChannel = useContext(SelectedChannelContext);
	const selectedServer = useContext(SelectedServerContext);

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
							fallback={<p>Voice channels are not supported.</p>}
						>
							{(channel) => <TextChannel channel={channel()} server={selectedServer} />}
						</Show>
					);
				}}
			</Show>
		</main>
	);
}
