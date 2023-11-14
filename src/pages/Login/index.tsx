import './index.css';
import styles from '@lib/util.module.scss';
import { For, Show, createSignal, useContext } from 'solid-js';
import detect from 'browser-detect';
import { ClientContext } from '@lib/context/client';
import { useNavigate } from '@solidjs/router';
import { createStore } from 'solid-js/store';

const displayMethods: Record<MFAMethod, string> = {
	Totp: 'TOTP Code',
	Recovery: 'Recovery Code',
	Password: 'Password'
};

function getFriendlyName(): string {
	const { mobile, os, name } = detect();

	let platform: string;
	if ('__TAURI__' in window && os != undefined) {
		platform = os.charAt(0).toUpperCase() + os.slice(1);
	} else if (name != undefined) {
		platform = name.charAt(0).toUpperCase() + name.slice(1);
	} else {
		platform = 'Unknown Platform';
	}

	return `Jolt ${mobile ? 'Mobile' : 'Desktop'} on ${platform}`;
}

function Login() {
	const client = useContext(ClientContext);
	const navigate = useNavigate();

	let emailInput: HTMLInputElement;
	let passwordInput: HTMLInputElement;

	const [rememberMe, setRememberMe] = createSignal(true);
	const [error, setError] = createSignal<string | undefined>(undefined);
	const [mfaMethods, setMfaMethods] = createStore<Partial<Record<MFAMethod, string>>>({
		Totp: '',
		Recovery: ''
	});

	async function handleLoginResponse(response: Exclude<ResponseLogin, { result: 'MFA' }>) {
		if (response.result == 'Disabled') {
			setError(`Account ${response.user_id} is disabled`);
			return;
		}

		if (rememberMe()) {
			localStorage.setItem('session', JSON.stringify(response));
		}

		client.authenticate(response);
		navigate('/');
	}

	async function login(event: Event) {
		event.preventDefault();

		setError(undefined);

		const friendly_name = getFriendlyName();
		const credentialLoginResponse: ResponseLogin | undefined = await client
			.login({
				email: emailInput.value.trim(),
				password: passwordInput.value.trim(),
				friendly_name
			})
			.catch((error) => setError(error));

		if (credentialLoginResponse == undefined) {
			return;
		}

		if (credentialLoginResponse.result == 'MFA') {
			let mfa_response: MFAResponse | undefined = undefined;
			if (mfaMethods.Totp) {
				mfa_response = { totp_code: mfaMethods.Totp };
			} else if (mfaMethods.Recovery) {
				mfa_response = { recovery_code: mfaMethods.Recovery };
			} else if (mfaMethods.Password) {
				mfa_response = { password: mfaMethods.Password };
			}

			if (mfa_response != undefined) {
				setError('MFA is required for this account.');
				return;
			}

			const mfaLoginResponse: ResponseLogin | undefined = await client
				.login({
					mfa_ticket: credentialLoginResponse.ticket,
					mfa_response,
					friendly_name
				})
				.catch((error) => setError(error));

			if (mfaLoginResponse == undefined) {
				return;
			}

			if (mfaLoginResponse.result == 'MFA') {
				setMfaMethods(
					Object.fromEntries(mfaLoginResponse.allowed_methods.map((method) => [method, '']))
				);
				setError('Invalid MFA code.');
				return;
			}

			handleLoginResponse(mfaLoginResponse);
			return;
		}

		handleLoginResponse(credentialLoginResponse);
	}

	return (
		<div class="modal">
			<form id="login-form" class="modal-base" onSubmit={login}>
				<h1>Jolt &#x26A1;</h1>

				<p>
					The Revolt client inspired by the revolt.chat client re-taped from the one that's held
					together by duct tape and bad code
				</p>

				<input type="email" placeholder="Email" ref={emailInput!} />
				<input type="password" placeholder="Password" ref={passwordInput!} />

				<p>
					Optionally, if your account uses MFA, use one of these methods, including the previous
					email and password as well
				</p>

				<For each={Object.entries(mfaMethods)}>
					{([key]) => (
						<input
							type="text"
							placeholder={displayMethods[key as MFAMethod]}
							onInput={(event) => setMfaMethods(key as MFAMethod, event.currentTarget.value)}
						/>
					)}
				</For>

				<label>
					Remember me
					<input
						type="checkbox"
						checked={rememberMe()}
						onInput={(event) => setRememberMe(event.currentTarget.checked)}
					/>
				</label>

				<button class={styles['button-primary']} type="submit">
					Login
				</button>

				<Show when={error() != undefined}>
					<p>{error()}</p>
				</Show>
			</form>
		</div>
	);
}

export default Login;
