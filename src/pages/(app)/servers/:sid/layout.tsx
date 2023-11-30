import { SelectedServerContext } from '@lib/context/selectedServer';
import { Outlet } from '@solidjs/router';
import {
	For,
	Match,
	Show,
	Switch,
	createMemo,
	createResource,
	createSelector,
	useContext
} from 'solid-js';
import ChannelItem from '@components/ChannelItem';
import util from '@lib/util';
import { HiOutlineSpeakerWave } from 'solid-icons/hi';
import { OcHash3 } from 'solid-icons/oc';
import { SelectedChannelContext } from '@lib/context/selectedChannel';
import api from '@lib/api';

export default function ServerWrapper() {
	const selectedServer = useContext(SelectedServerContext);
	const selectedChannel = useContext(SelectedChannelContext)!;
	const channelIsSelected = createSelector(() => selectedChannel()?._id);

	return (
		<Show when={selectedServer() != undefined && selectedServer()}>
			{(serverAccessor) => {
				const server = () => serverAccessor();

				return (
					<Show when={server()} fallback={<p>Unresolved server</p>}>
						{(server) => {
							function createChannelResource(id: string) {
								return createResource(() => id, api.fetchChannel);
							}

							const channels = createMemo(() => {
								return {
									unsorted: server().channels.flatMap((channel) => {
										if (
											server().categories != undefined &&
											server().categories?.some((category) => category.channels.includes(channel))
										) {
											return [];
										}

										return [createChannelResource(channel)];
									}),
									categorized: server().categories?.flatMap((category) => {
										if (category.channels.length == 0) {
											return [];
										}
										return {
											...category,
											channels: category.channels.map(createChannelResource)
										};
									})
								};
							});

							return (
								<>
									<div class="channel-bar-container">
										<For each={channels().unsorted}>
											{([channel]) => (
												<Show when={channel.state == 'ready' && channel()}>
													{(channel) => (
														<ChannelComponent
															channel={channel()}
															selected={channelIsSelected(channel()._id)}
														/>
													)}
												</Show>
											)}
										</For>
										<For each={channels().categorized}>
											{(category) => (
												<details open>
													<summary>{category.title}</summary>
													<For each={category.channels}>
														{([channel]) => (
															<Show when={channel.state == 'ready' && channel()}>
																{(channel) => {
																	return (
																		<ChannelComponent
																			channel={channel()}
																			selected={channelIsSelected(channel()._id)}
																		/>
																	);
																}}
															</Show>
														)}
													</For>
												</details>
											)}
										</For>
									</div>
									<Outlet />
								</>
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
	const server = useContext(SelectedServerContext)!;
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
					href={`/servers/${server()!._id}/channels/${channel()._id}`}
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
