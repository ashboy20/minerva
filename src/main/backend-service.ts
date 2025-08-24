/**
 * FastAPI Backend Service Manager
 * Manages the lifecycle of the Python FastAPI backend server
 */

import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import path from 'path';
import net from 'net';
import log from 'electron-log';

export class BackendService {
	private pythonProcess: ChildProcess | null = null;
	private readonly backendPath: string;
	private readonly host: string = '0.0.0.0';
	private readonly port: number = 50051;
	private isStarting: boolean = false;
	private isRunning: boolean = false;

	constructor() {
		// Path to the FastAPI backend
		this.backendPath = path.join(__dirname, '..', 'backend');
	}

	/**
	 * Start the FastAPI backend server
	 */
	async start(): Promise<boolean> {
		if (this.isRunning || this.isStarting) {
			log.info('Backend service is already running or starting');
			return true;
		}

		this.isStarting = true;

		try {
			// Check if port is already in use
			const isPortInUse = await this.checkPort(this.port);
			if (isPortInUse) {
				log.info(`FastAPI server already running on port ${this.port}`);
				this.isRunning = true;
				this.isStarting = false;
				return true;
			}

			log.info('Starting FastAPI backend server...');
			// Try to use Python from virtual environment if available
			let pythonCmd = 'python';
			const venvPython = path.join(this.backendPath, '.venv', 'bin', 'python');
			try {
				// Synchronously check if venv python exists and is executable
				require('fs').accessSync(venvPython, require('fs').constants.X_OK);
				pythonCmd = venvPython;
				log.info(`Using Python from virtualenv: ${pythonCmd}`);
			} catch (err) {
				log.info('Could not find Python in .venv, falling back to system python');
			}

			// Spawn Python process
			this.pythonProcess = spawn(pythonCmd, ['main.py'], {
				cwd: this.backendPath,
				stdio: ['inherit', 'pipe', 'pipe'],
			});

			// Handle process output
			this.pythonProcess.stdout?.on('data', (data) => {
				log.info(`FastAPI stdout: ${data.toString()}`);
			});

			this.pythonProcess.stderr?.on('data', (data) => {
				log.error(`FastAPI stderr: ${data.toString()}`);
			});

			// Handle process exit
			this.pythonProcess.on('exit', (code, signal) => {
				log.info(`FastAPI process exited with code ${code} and signal ${signal}`);
				this.isRunning = false;
				this.pythonProcess = null;
			});

			this.pythonProcess.on('error', (error) => {
				log.error(`FastAPI process error: ${error.message}`);
				this.isRunning = false;
				this.pythonProcess = null;
				this.isStarting = false;
			});

			// Wait for server to start
			await this.waitForServer();

			this.isRunning = true;
			this.isStarting = false;

			log.info(`FastAPI server started successfully on http://${this.host}:${this.port}`);
			return true;

		} catch (error) {
			log.error(`Failed to start FastAPI server: ${error}`);
			this.isStarting = false;
			return false;
		}
	}

	/**
	 * Stop the FastAPI backend server
	 */
	async stop(): Promise<void> {
		if (!this.pythonProcess) {
			log.info('FastAPI server is not running');
			return;
		}

		log.info('Stopping FastAPI backend server...');

		try {
			// Graceful shutdown
			this.pythonProcess.kill('SIGTERM');

			// Wait for process to exit
			await new Promise<void>((resolve) => {
				if (!this.pythonProcess) {
					resolve();
					return;
				}

				const timeout = setTimeout(() => {
					// Force kill if graceful shutdown fails
					if (this.pythonProcess) {
						this.pythonProcess.kill('SIGKILL');
					}
					resolve();
				}, 5000);

				this.pythonProcess.on('exit', () => {
					clearTimeout(timeout);
					resolve();
				});
			});

			this.isRunning = false;
			this.pythonProcess = null;
			log.info('FastAPI server stopped successfully');

		} catch (error) {
			log.error(`Error stopping FastAPI server: ${error}`);
		}
	}

	/**
	 * Restart the FastAPI backend server
	 */
	async restart(): Promise<boolean> {
		await this.stop();
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
		return await this.start();
	}

	/**
	 * Check if the backend server is running
	 */
	isServerRunning(): boolean {
		return this.isRunning;
	}

	/**
	 * Get the server URL
	 */
	getServerUrl(): string {
		return `http://${this.host}:${this.port}`;
	}

	/**
	 * Check if port is in use
	 */
	private checkPort(port: number): Promise<boolean> {
		return new Promise((resolve) => {
			const server = net.createServer();

			server.listen(port, '127.0.0.1', () => {
				server.once('close', () => resolve(false)); // Port is free
				server.close();
			});

			server.on('error', () => resolve(true)); // Port is in use
		});
	}

	/**
	 * Wait for server to become available
	 */
	private async waitForServer(maxAttempts: number = 30): Promise<void> {
		for (let i = 0; i < maxAttempts; i++) {
			try {
				const response = await fetch(`${this.getServerUrl()}`, {
					method: 'GET',
					signal: AbortSignal.timeout(1000)
				});
				if (response.ok) {
					return;
				}
			} catch (error) {
				// Server not ready yet, continue waiting
			}

			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		throw new Error('FastAPI server did not start within expected time');
	}
}

// Singleton instance
let backendServiceInstance: BackendService | null = null;

export function getBackendService(): BackendService {
	if (!backendServiceInstance) {
		backendServiceInstance = new BackendService();
	}
	return backendServiceInstance;
}

// Auto-start/stop with Electron app
export function setupBackendServiceLifecycle(): void {
	const backendService = getBackendService();

	app.on('before-quit', async (event) => {
		if (backendService.isServerRunning()) {
			event.preventDefault();
			await backendService.stop();
			app.quit();
		}
	});

	app.on('window-all-closed', async () => {
		if (backendService.isServerRunning()) {
			await backendService.stop();
		}
	});
}
