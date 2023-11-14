export class AutumnClient {
	async uploadFile(file: File, tag = 'attachments'): Promise<string> {
		const form = new FormData();

		form.append('file', file);

		const { id } = await fetch(`https://autumn.revolt.chat/${tag}`, {
			method: 'POST',
			body: form
		}).then((response) => response.json());

		return id;
	}
}
