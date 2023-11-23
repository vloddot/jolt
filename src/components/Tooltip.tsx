import {
	createEffect,
	mergeProps,
	type JSX,
	untrack,
	createComputed,
	onCleanup,
	splitProps
} from 'solid-js';
import tippy from 'tippy.js';

export type Props = {
	hidden?: boolean | undefined;
	disabled?: boolean | undefined;
	children: JSX.Element;
} & Partial<import('tippy.js').Props>;

export default function Tooltip(_props: Props) {
	const props = mergeProps({ hidden: true, disabled: false }, _props);
	const [localProps, tippyProps] = splitProps(props, ['hidden', 'disabled', 'children']);

	let target: HTMLSpanElement;

	createEffect(() => {
		const instance = tippy(
			target,
			untrack(() => tippyProps)
		);

		createComputed(() => {
			if (localProps.disabled) {
				instance.disable();
			} else {
				instance.enable();
			}
		});

		createComputed(() => {
			if (localProps.hidden) {
				instance.hide();
			} else {
				instance.show();
			}
		});

		createComputed(() => {
			instance.setProps(tippyProps ?? {});
		});

		onCleanup(instance.destroy);
	});

	return <span ref={target!}>{props.children}</span>;
}
