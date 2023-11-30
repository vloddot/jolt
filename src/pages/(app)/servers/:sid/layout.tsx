import { SelectedServerIdContext } from '@lib/context/SelectedServerId';
import { Outlet } from '@solidjs/router';
import {
	For,
	Match,
	Show,
	Switch,
	createMemo,
	createSelector,
	useContext
} from 'solid-js';
import ChannelItem from '@components/ChannelItem';
import util from '@lib/util';
import { HiOutlineSpeakerWave } from 'solid-icons/hi';
import { OcHash3 } from 'solid-icons/oc';
import { SelectedChannelIdContext } from '@lib/context/SelectedChannelId';
import { ServerCollectionContext } from '@lib/context/collections/Servers';
import { SelectedServerContext } from '@lib/context/SelectedServer';
import { ChannelCollectionContext } from '@lib/context/collections/Channels';

export default function ServerWrapper() {
	const selectedServer = useContext(SelectedServerIdContext);
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const channelIsSelected = createSelector(selectedChannelId);

	return (
		<Show when={selectedServer() != undefined && selectedServer()}>
			{(id) => {
				const servers = useContext(ServerCollectionContext);
				const server = createMemo(() => servers.get(id()));

				return (
					<Show when={server()} fallback={<p>Unresolved server</p>}>
						{(serverAccesor) => {
							function getChannel(id: string) {
								const channel = channelCollection.get(id);
								if (channel == undefined) {
									return [];
								}

								return [channel[0]];
							}

							const server = () => serverAccesor()[0];
							const channelCollection = useContext(ChannelCollectionContext);
							const channels = createMemo(() => {
								return {
									unsorted: server().channels.flatMap((channel_id) => {
										if (
											server().categories != undefined &&
											server().categories?.some((category) =>
												category.channels.includes(channel_id)
											)
										) {
											return [];
										}

										return getChannel(channel_id);
									}),
									categorized: server().categories?.flatMap((category) => {
										if (category.channels.length == 0) {
											return [];
										}

										return [
											{
												...category,
												channels: category.channels.flatMap(getChannel)
											}
										];
									})
								};
							});

							return (
								<SelectedServerContext.Provider value={server}>
									<div class="channel-bar-container">
										<For each={channels().unsorted}>
											{(channel) => (
												<ChannelComponent
													channel={channel}
													selected={channelIsSelected(channel._id)}
												/>
											)}
										</For>
										<For each={channels().categorized}>
											{(category) => (
												<details open>
													<summary>{category.title}</summary>
													<For each={category.channels}>
														{(channel) => (
															<ChannelComponent
																channel={channel}
																selected={channelIsSelected(channel._id)}
															/>
														)}
													</For>
												</details>
											)}
										</For>
									</div>
									<Outlet />
								</SelectedServerContext.Provider>
							);
						}}
					</Show>
				);
			}}
		</Show>
	);
}

interface ChannelComponentProps {
	channel: Channel;
	selected: boolean;
}

function ChannelComponent(props: ChannelComponentProps) {
	const selectedServerId = useContext(SelectedServerIdContext)!;
	const unread = createMemo(() => util.isUnread(props.channel));

	return (
		<Show
			when={
				(props.channel.channel_type == 'TextChannel' ||
					props.channel.channel_type == 'VoiceChannel') &&
				props.channel
			}
		>
			{(channel) => (
				<ChannelItem
					href={`/servers/${selectedServerId()}/channels/${channel()._id}`}
					selected={props.selected}
					unread={unread()}
				>
					<Show
						when={channel().icon != undefined && channel().icon}
						fallback={
							<Switch>
								<Match when={channel().channel_type == 'VoiceChannel'}>
									<HiOutlineSpeakerWave />
								</Match>
								<Match when={channel().channel_type == 'TextChannel'}>
									<OcHash3 />
								</Match>
							</Switch>
						}
					>
						{(icon) => <img src={util.getAutumnURL(icon())} alt={channel().name} />}
					</Show>
					<span>{channel().name}</span>
				</ChannelItem>
			)}
		</Show>
	);
}
