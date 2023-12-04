import { createContext, type Accessor } from 'solid-js';

export const ServerMembersListContext = createContext<Accessor<AllMemberResponseMap | undefined>>(
	() => undefined
);
