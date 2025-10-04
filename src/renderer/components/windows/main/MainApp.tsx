import React, { useEffect, useState } from 'react';

// Component for the main window of the Electron Hotplate demo
export default function MainApp() {
	const [message, setMessage] = useState<string>('');

	useEffect(() => {
		// Listen for messages from child windows
		window.electron.ipcRenderer.on(
			'child-window-message',
			(_, data) => {
				setMessage(String(data));
			},
		);

		// Cleanup listener on component unmount
		return () => {
			window.electron.ipcRenderer.removeAllListeners(
				'child-window-message',
			);
		};
	}, []);

	// Handler to open a new child window
	const openChildWindow = () => {
		window.electron.ipcRenderer.send('open-child-window');
	};

	return (
		<div className="min-h-screen bg-gray-100 p-8 text-black">
			<h1 className="mb-6 text-4xl font-bold">
				Electron Hotplate Demo
			</h1>
			<div className="space-y-4">
				<button
					onClick={openChildWindow}
					className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
					type="button"
				>
					Open Child Window
				</button>
				<p>Latest Message: {message}</p>
			</div>
		</div>
	);
}
