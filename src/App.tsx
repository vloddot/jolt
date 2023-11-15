import { Routes, Route } from '@solidjs/router';
import Login from './pages/Login';
import AppWrapper from './pages/(app)/layout';

function App() {
	return (
		<Routes>
			<Route path="/" component={AppWrapper}></Route>
			<Route path="/login" component={Login}></Route>
		</Routes>
	);
}

export default App;
