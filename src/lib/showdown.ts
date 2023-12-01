import showdown from 'showdown';

const converter = new showdown.Converter({
	emoji: true,
	ghCompatibleHeaderId: true,
	openLinksInNewWindow: true,
	strikethrough: true,
	tables: true,
	tasklists: true,
	underline: true,
});

export default converter;
