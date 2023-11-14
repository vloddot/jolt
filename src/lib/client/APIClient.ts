export class APIClient {
	token: string | undefined;

	constructor(token?: string) {
		if (token) {
			this.token = token;
		}
	}

	async req(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
		path: string,
		body?: string
	): Promise<Response> {
		const response = await fetch(`https://api.revolt.chat${path}`, {
			method,
			body,
			headers: this.token == undefined ? undefined : { 'x-session-token': this.token }
		});

		return response;
	}

	get(path: string, body?: string): Promise<Response> {
		return this.req('GET', path, body);
	}

	post(path: string, body?: string): Promise<Response> {
		return this.req('POST', path, body);
	}

	put(path: string, body?: string): Promise<Response> {
		return this.req('PUT', path, body);
	}

	delete(path: string, body?: string): Promise<Response> {
		return this.req('DELETE', path, body);
	}

	patch(path: string, body?: string): Promise<Response> {
		return this.req('PATCH', path, body);
	}
}
