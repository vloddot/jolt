import { SelectedServerIdContext } from '@lib/context/SelectedServerId';
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
import { ServerCollectionContext } from '@lib/context/collections/Servers';
import { SelectedServerContext } from '@lib/context/SelectedServer';
import { ChannelCollectionContext } from '@lib/context/collections/Channels';
import { SelectedChannelIdContext } from '@lib/context/SelectedChannelId';
import api from '@lib/api';
import UserButton from '@components/User/UserButton';
import { UnreadsCollectionContext } from '@lib/context/collections/Unreads';

export default function ServerWrapper() {
	const selectedServer = useContext(SelectedServerIdContext);

	return (
		<Show when={selectedServer() != undefined && selectedServer()}>
			{(id) => {
				const servers = useContext(ServerCollectionContext);
				const server = createMemo(() => servers.get(id()));

				return (
					<Show when={server()} fallback={<p>Unresolved server</p>}>
						{(server) => {
							return (
								<SelectedServerContext.Provider value={() => server()[0]}>
									<ChannelBar />
									<main class="main-content-container">
										<Outlet />
									</main>
									<MembersList />
								</SelectedServerContext.Provider>
							);
						}}
					</Show>
				);
			}}
		</Show>
	);
}

function ChannelBar() {
	const selectedChannelId = useContext(SelectedChannelIdContext);
	const channelIsSelected = createSelector(selectedChannelId);

	const server = useContext(SelectedServerContext);
	const channelCollection = useContext(ChannelCollectionContext);

	function getChannel(id: string) {
		const channel = channelCollection.get(id);
		if (channel == undefined) {
			return [];
		}

		return [channel[0]];
	}

	const channels = createMemo(() => {
		const s = server();
		if (s == undefined) {
			return { unsorted: [], categorized: [] };
		}

		return {
			unsorted: s.channels.flatMap((channel_id) => {
				if (
					s.categories != undefined &&
					s.categories?.some((category) => category.channels.includes(channel_id))
				) {
					return [];
				}

				return getChannel(channel_id);
			}),
			categorized: s.categories?.flatMap((category) => {
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
		<div class="channel-bar-container">
			<For each={channels().unsorted}>
				{(channel) => (
					<ChannelComponent channel={channel} selected={channelIsSelected(channel._id)} />
				)}
			</For>
			<For each={channels().categorized}>
				{(category) => (
					<details open>
						<summary>{category.title}</summary>
						<For each={category.channels}>
							{(channel) => (
								<ChannelComponent channel={channel} selected={channelIsSelected(channel._id)} />
							)}
						</For>
					</details>
				)}
			</For>
		</div>
	);
}

interface ChannelComponentProps {
	channel: Channel;
	selected: boolean;
}

function ChannelComponent(props: ChannelComponentProps) {
	const selectedServerId = useContext(SelectedServerIdContext)!;
	const unreads = useContext(UnreadsCollectionContext);
	const unreadObject = createMemo(() => unreads.get(props.channel._id)?.[0]);

	const unread = createMemo(() => {
		const o = unreadObject();
		return o == undefined ? false : util.isUnread(props.channel, o);
	});

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
					mentions={unreadObject()?.mentions?.length}
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

function MembersList() {
	const server = useContext(SelectedServerContext);
	return (
		<Show when={server()}>
			{(server) => {
				const [response] = createResource(() => server()._id, api.fetchMembers);

				return (
					<div class="members-list-container">
						<Switch>
							<Match when={response.state == 'errored'}>Error fetching members</Match>
							<Match when={response.state == 'pending' || response.state == 'refreshing'}>
								Loading members...
							</Match>
							<Match when={response.state == 'unresolved'}>Unresolved server</Match>
							<Match when={response.state == 'ready' && response()}>
								{(response) => {
									const users = createMemo(
										() => new Map(response().users.map((user) => [user._id, user]))
									);

									return (
										<For each={response().members}>
											{(member) => {
												const user = createMemo(() => users().get(member._id.user));

												return (
													<Show when={user()}>
														{(user) => <UserButton user={user()} member={member} />}
													</Show>
												);
											}}
										</For>
									);
								}}
							</Match>
						</Switch>
					</div>
				);
			}}
		</Show>
	);
}
