import { SettingsContext } from '@lib/context/Settings';
import { ServerCollectionContext } from '@lib/context/collections/Servers';
import util from '@lib/util';
import { createMemo, useContext, type JSX, splitProps } from 'solid-js';

export type Props = {
	member?: Member;
	message?: Message;
	children: JSX.Element;
} & JSX.HTMLAttributes<HTMLSpanElement>;

export default function RoleColorStyle(_props: Props) {
	const [settings] = useContext(SettingsContext);

	const [props, elementProps] = splitProps(_props, ['member', 'message', 'children']);

	const serverCollection = useContext(ServerCollectionContext);

	const server = createMemo(() =>
		props.member == undefined ? undefined : serverCollection.get(props.member._id.server)?.[0]
	);

	const displayNameStyle = createMemo(() => {
		if (!settings['appearance:show-role-colors']) {
			return {};
		}

		const s = server();
		if (props.member?.roles == undefined || s == undefined) {
			return {};
		}

		const color =
			util.sortRoles(s, props.member.roles).find((role) => role.colour != undefined)?.colour ??
			'inherit';

		return util.getRoleColorStyle(color);
	});

	return (
		<span style={displayNameStyle()} {...elementProps}>
			{props.children}
		</span>
	);
}
