import type { JSX } from 'solid-js';
import { type Accessor, createContext, createSignal } from 'solid-js';

export type SendableReply = Omit<Reply, 'id'> & {
	message: Message;
};

interface Props {
	children: JSX.Element;
}

export const RepliesContext = createContext<
	[
		Accessor<SendableReply[]>,
		{
			pushReply: (message: Message, mention: boolean) => void;
			removeReply: (id: string) => void;
		}
	]
>();

export default function RepliesProvider(props: Props) {
	const [replies, setReplies] = createSignal<SendableReply[]>([]);

	return (
		<RepliesContext.Provider
			value={[
				replies,
				{
					pushReply(message, mention) {
						setReplies((replies) => [...replies, { message, mention }]);
					},
					removeReply(id) {
						setReplies((replies) => replies.filter((reply) => reply.message._id != id));
					}
				}
			]}
		>
			{props.children}
		</RepliesContext.Provider>
	);
}
