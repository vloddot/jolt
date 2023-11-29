import { createContext, createSignal } from 'solid-js';

export type SendableReply = Omit<Reply, 'id'> & {
	message: Message;
};

export const RepliesContext = createContext(
	// eslint-disable-next-line solid/reactivity
	createSignal<CollectionItem<SendableReply>[]>([])
);
