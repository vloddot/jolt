import ServerLoader from '@components/ServerLoader';
import { SelectedServerIdContext } from '@lib/context/selectedServerId';
import { Outlet } from '@solidjs/router';
import { Index, Match, Show, Switch, useContext } from 'solid-js';
import { SelectedServerContext } from './context';
import ClientContext from '@lib/context/client';
import ChannelLoader from '@components/ChannelLoader';
import ChannelItem from '@components/Channel/ChannelItem';
import util from '@lib/util';
import { HiOutlineSpeakerWave } from 'solid-icons/hi';
import { OcHash3 } from 'solid-icons/oc';

export default function ServerWrapper() {
	const selectedServerId = useContext(SelectedServerIdContext);
	const client = useContext(ClientContext);

	return (
		<>
			<Show when={selectedServerId() != undefined && selectedServerId()}>
				{(id) => (
					<ServerLoader id={id()}>
						{(server) => {
							return (
								<SelectedServerContext.Provider value={server()}>
									<div class="channel-bar-container">
										{/*
											we need the client to be connected to the websocket here
											because this is too much channels to load without cache,
											easy way to cause a 429.
										*/}
										<Show when={client.connectionState() == 'connected'}>
											<Index each={server().channels}>
												{(id) => (
													<ChannelLoader id={id()}>
														{(channelAccessor) => {
															const channel = channelAccessor();
															if (
																channel.channel_type != 'TextChannel' &&
																channel.channel_type != 'VoiceChannel'
															) {
																return null;
															}

															return (
																<ChannelItem
																	href={`/servers/${server()._id}/channels/${channel._id}`}
																	selected={false}
																	unread={false}
																>
																	<Show
																		when={channel.icon != undefined && channel.icon}
																		fallback={
																			<Switch>
																				<Match when={channel.channel_type == 'VoiceChannel'}>
																					<HiOutlineSpeakerWave />
																				</Match>
																				<Match when={channel.channel_type == 'TextChannel'}>
																					<OcHash3 />
																				</Match>
																			</Switch>
																		}
																	>
																		{(icon) => (
																			<img src={util.getAutumnURL(icon())} alt={channel.name} />
																		)}
																	</Show>
																	<span>{channel.name}</span>
																</ChannelItem>
															);
														}}
													</ChannelLoader>
												)}
											</Index>
										</Show>
									</div>
									<Outlet />
								</SelectedServerContext.Provider>
							);
						}}
					</ServerLoader>
				)}
			</Show>
		</>
	);
}
