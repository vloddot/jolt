import { createContext, createResource, type Accessor } from 'solid-js';

export const ServerMembersListContext = createContext<Accessor<AllMemberResponseMap | undefined>>(
	createResource(() => undefined)[0]
);
