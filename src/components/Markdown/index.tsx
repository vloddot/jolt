import styles from './index.module.scss';
import converter from '@lib/showdown';
import DOMPurify from 'dompurify';
import { createEffect, createMemo } from 'solid-js';

export interface Props {
	content: string;
}

export default function Markdown(props: Props) {
	const content = createMemo(() => {
		const html = converter.makeHtml(
			// https://github.com/markedjs/marked/issues/2139 (we don't use marked but this still applies)
			// eslint-disable-next-line no-misleading-character-class
			props.content.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '')
		);

		return DOMPurify.sanitize(html);
	});

	createEffect(() => console.log(content()));

	// eslint-disable-next-line solid/no-innerhtml
	return <span class={styles.markdownBase} innerHTML={content()} />;
}
