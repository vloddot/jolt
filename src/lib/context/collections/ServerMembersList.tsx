import { createContext, createResource, type Resource } from 'solid-js';

export const ServerMembersListContext = createContext<Resource<AllMemberResponseMap | undefined>>(
	createResource(() => undefined)[0]
);
