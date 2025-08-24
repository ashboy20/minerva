import React, { useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/renderer/components/ui/card';
import { Switch } from '@/renderer/components/ui/switch';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Separator } from '@/renderer/components/ui/separator';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/renderer/components/ui/select';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { Badge } from '@/renderer/components/ui/badge';
import {
	GearIcon,
	PlusIcon,
	TrashIcon,
	LockClosedIcon,
	ClockIcon,
	GlobeIcon,
} from '@radix-ui/react-icons';

interface EnvironmentVariable {
	key: string;
	value: string;
	enabled: boolean;
}

interface Settings {
	timeout: number;
	followRedirects: boolean;
	validateSSL: boolean;
	maxRedirects: number;
	userAgent: string;
	defaultHeaders: { key: string; value: string }[];
	environment: string;
	environments: { name: string; variables: EnvironmentVariable[] }[];
}

const defaultSettings: Settings = {
	timeout: 30000,
	followRedirects: true,
	validateSSL: true,
	maxRedirects: 5,
	userAgent: 'API Client/1.0',
	defaultHeaders: [
		{ key: 'Accept', value: 'application/json' },
		{ key: 'Content-Type', value: 'application/json' },
	],
	environment: 'development',
	environments: [
		{
			name: 'development',
			variables: [
				{ key: 'BASE_URL', value: 'http://localhost:3000', enabled: true },
				{ key: 'API_KEY', value: 'dev-api-key', enabled: true },
			],
		},
		{
			name: 'staging',
			variables: [
				{ key: 'BASE_URL', value: 'https://staging.api.example.com', enabled: true },
				{ key: 'API_KEY', value: 'staging-api-key', enabled: true },
			],
		},
		{
			name: 'production',
			variables: [
				{ key: 'BASE_URL', value: 'https://api.example.com', enabled: true },
				{ key: 'API_KEY', value: 'prod-api-key', enabled: true },
			],
		},
	],
};

export function ApiClientSettings() {
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const [newEnvName, setNewEnvName] = useState('');

	const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
		setSettings(prev => ({ ...prev, [key]: value }));
	};

	const addDefaultHeader = () => {
		setSettings(prev => ({
			...prev,
			defaultHeaders: [...prev.defaultHeaders, { key: '', value: '' }],
		}));
	};

	const updateDefaultHeader = (index: number, field: 'key' | 'value', value: string) => {
		setSettings(prev => ({
			...prev,
			defaultHeaders: prev.defaultHeaders.map((header, i) =>
				i === index ? { ...header, [field]: value } : header
			),
		}));
	};

	const removeDefaultHeader = (index: number) => {
		setSettings(prev => ({
			...prev,
			defaultHeaders: prev.defaultHeaders.filter((_, i) => i !== index),
		}));
	};

	const addEnvironment = () => {
		if (!newEnvName.trim()) return;

		setSettings(prev => ({
			...prev,
			environments: [
				...prev.environments,
				{
					name: newEnvName,
					variables: [{ key: '', value: '', enabled: true }],
				},
			],
		}));
		setNewEnvName('');
	};

	const updateEnvironmentVariable = (
		envIndex: number,
		varIndex: number,
		field: 'key' | 'value' | 'enabled',
		value: string | boolean
	) => {
		setSettings(prev => ({
			...prev,
			environments: prev.environments.map((env, i) =>
				i === envIndex
					? {
							...env,
							variables: env.variables.map((variable, j) =>
								j === varIndex ? { ...variable, [field]: value } : variable
							),
					  }
					: env
			),
		}));
	};

	const addEnvironmentVariable = (envIndex: number) => {
		setSettings(prev => ({
			...prev,
			environments: prev.environments.map((env, i) =>
				i === envIndex
					? {
							...env,
							variables: [...env.variables, { key: '', value: '', enabled: true }],
					  }
					: env
			),
		}));
	};

	const removeEnvironmentVariable = (envIndex: number, varIndex: number) => {
		setSettings(prev => ({
			...prev,
			environments: prev.environments.map((env, i) =>
				i === envIndex
					? {
							...env,
							variables: env.variables.filter((_, j) => j !== varIndex),
					  }
					: env
			),
		}));
	};

	const saveSettings = () => {
		// In a real app, you would save to localStorage or a config file
		console.log('Saving settings:', settings);
		// Show success toast or notification
	};

	const resetSettings = () => {
		setSettings(defaultSettings);
	};

	const currentEnvironment = settings.environments.find(env => env.name === settings.environment);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">API Client Settings</h1>
					<p className="text-muted-foreground">
						Configure your API client preferences and environment variables
					</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="outline" onClick={resetSettings}>
						Reset to Defaults
					</Button>
					<Button onClick={saveSettings}>
						Save Settings
					</Button>
				</div>
			</div>

			<Tabs defaultValue="general" className="space-y-4">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="general">
						<GearIcon className="w-4 h-4 mr-2" />
						General
					</TabsTrigger>
					<TabsTrigger value="network">
						<GlobeIcon className="w-4 h-4 mr-2" />
						Network
					</TabsTrigger>
					<TabsTrigger value="security">
						<LockClosedIcon className="w-4 h-4 mr-2" />
						Security
					</TabsTrigger>
					<TabsTrigger value="environments">
						<ClockIcon className="w-4 h-4 mr-2" />
						Environments
					</TabsTrigger>
				</TabsList>

				<TabsContent value="general" className="space-y-4">
					{/* General Settings */}
					<Card>
						<CardHeader>
							<CardTitle>General Preferences</CardTitle>
							<CardDescription>Basic configuration for the API client</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="timeout">Request Timeout (ms)</Label>
									<Input
										id="timeout"
										type="number"
										value={settings.timeout}
										onChange={(e) => updateSetting('timeout', parseInt(e.target.value) || 0)}
									/>
								</div>
								<div>
									<Label htmlFor="maxRedirects">Max Redirects</Label>
									<Input
										id="maxRedirects"
										type="number"
										value={settings.maxRedirects}
										onChange={(e) => updateSetting('maxRedirects', parseInt(e.target.value) || 0)}
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="userAgent">User Agent</Label>
								<Input
									id="userAgent"
									value={settings.userAgent}
									onChange={(e) => updateSetting('userAgent', e.target.value)}
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Switch
									id="followRedirects"
									checked={settings.followRedirects}
									onCheckedChange={(checked) => updateSetting('followRedirects', checked)}
								/>
								<Label htmlFor="followRedirects">Follow redirects automatically</Label>
							</div>
						</CardContent>
					</Card>

					{/* Default Headers */}
					<Card>
						<CardHeader>
							<CardTitle>Default Headers</CardTitle>
							<CardDescription>Headers that will be automatically added to all requests</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								{settings.defaultHeaders.map((header, index) => (
									<div key={index} className="flex items-center space-x-2">
										<Input
											placeholder="Header key"
											value={header.key}
											onChange={(e) => updateDefaultHeader(index, 'key', e.target.value)}
											className="flex-1"
										/>
										<Input
											placeholder="Header value"
											value={header.value}
											onChange={(e) => updateDefaultHeader(index, 'value', e.target.value)}
											className="flex-1"
										/>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => removeDefaultHeader(index)}
											disabled={settings.defaultHeaders.length === 1}
										>
											<TrashIcon className="w-4 h-4" />
										</Button>
									</div>
								))}
							</div>
							<Button variant="outline" onClick={addDefaultHeader}>
								<PlusIcon className="w-4 h-4 mr-2" />
								Add Header
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="network" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Network Configuration</CardTitle>
							<CardDescription>Configure network-related settings</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label>Connection Timeout</Label>
									<Input
										type="number"
										value={settings.timeout}
										onChange={(e) => updateSetting('timeout', parseInt(e.target.value) || 0)}
									/>
									<p className="text-sm text-muted-foreground mt-1">
										Time to wait for connection (milliseconds)
									</p>
								</div>
								<div>
									<Label>Read Timeout</Label>
									<Input
										type="number"
										value={settings.timeout}
										onChange={(e) => updateSetting('timeout', parseInt(e.target.value) || 0)}
									/>
									<p className="text-sm text-muted-foreground mt-1">
										Time to wait for response (milliseconds)
									</p>
								</div>
							</div>
							<Separator />
							<div className="space-y-4">
								<h4 className="font-medium">Proxy Settings</h4>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Proxy Host</Label>
										<Input placeholder="proxy.example.com" />
									</div>
									<div>
										<Label>Proxy Port</Label>
										<Input placeholder="8080" type="number" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>Proxy Username</Label>
										<Input placeholder="username" />
									</div>
									<div>
										<Label>Proxy Password</Label>
										<Input placeholder="password" type="password" />
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>SSL/TLS Configuration</CardTitle>
							<CardDescription>Configure security and certificate settings</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center space-x-2">
								<Switch
									id="validateSSL"
									checked={settings.validateSSL}
									onCheckedChange={(checked) => updateSetting('validateSSL', checked)}
								/>
								<Label htmlFor="validateSSL">Validate SSL certificates</Label>
							</div>
							<Separator />
							<div className="space-y-4">
								<h4 className="font-medium">Client Certificates</h4>
								<div className="space-y-2">
									<div>
										<Label>Certificate File (.crt)</Label>
										<Input placeholder="Select certificate file..." />
									</div>
									<div>
										<Label>Private Key File (.key)</Label>
										<Input placeholder="Select private key file..." />
									</div>
									<div>
										<Label>Passphrase (optional)</Label>
										<Input placeholder="Enter passphrase..." type="password" />
									</div>
								</div>
							</div>
							<Separator />
							<div className="space-y-4">
								<h4 className="font-medium">CA Certificates</h4>
								<Textarea
									placeholder="Paste CA certificate content here..."
									className="min-h-24"
								/>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="environments" className="space-y-4">
					{/* Environment Selection */}
					<Card>
						<CardHeader>
							<CardTitle>Current Environment</CardTitle>
							<CardDescription>Select the active environment for variable substitution</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center space-x-4">
								<div className="flex-1">
									<Select
										value={settings.environment}
										onValueChange={(value) => updateSetting('environment', value)}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{settings.environments.map((env) => (
												<SelectItem key={env.name} value={env.name}>
													{env.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<Badge variant="secondary">
									{currentEnvironment?.variables.filter(v => v.enabled).length || 0} variables
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Environment Variables */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Environment Variables</CardTitle>
									<CardDescription>
										Variables for the {settings.environment} environment
									</CardDescription>
								</div>
								<Button
									variant="outline"
									onClick={() => {
										const envIndex = settings.environments.findIndex(
											env => env.name === settings.environment
										);
										if (envIndex !== -1) addEnvironmentVariable(envIndex);
									}}
								>
									<PlusIcon className="w-4 h-4 mr-2" />
									Add Variable
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{currentEnvironment && (
								<div className="space-y-2">
									{currentEnvironment.variables.map((variable, varIndex) => {
										const envIndex = settings.environments.findIndex(
											env => env.name === settings.environment
										);
										return (
											<div key={varIndex} className="flex items-center space-x-2">
												<input
													type="checkbox"
													checked={variable.enabled}
													onChange={(e) =>
														updateEnvironmentVariable(envIndex, varIndex, 'enabled', e.target.checked)
													}
													className="w-4 h-4"
												/>
												<Input
													placeholder="Variable name"
													value={variable.key}
													onChange={(e) =>
														updateEnvironmentVariable(envIndex, varIndex, 'key', e.target.value)
													}
													className="flex-1"
												/>
												<Input
													placeholder="Variable value"
													value={variable.value}
													onChange={(e) =>
														updateEnvironmentVariable(envIndex, varIndex, 'value', e.target.value)
													}
													className="flex-1"
												/>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeEnvironmentVariable(envIndex, varIndex)}
													disabled={currentEnvironment.variables.length === 1}
												>
													<TrashIcon className="w-4 h-4" />
												</Button>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Add New Environment */}
					<Card>
						<CardHeader>
							<CardTitle>Add New Environment</CardTitle>
							<CardDescription>Create a new environment configuration</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex space-x-2">
								<Input
									placeholder="Environment name"
									value={newEnvName}
									onChange={(e) => setNewEnvName(e.target.value)}
									className="flex-1"
								/>
								<Button onClick={addEnvironment} disabled={!newEnvName.trim()}>
									<PlusIcon className="w-4 h-4 mr-2" />
									Add Environment
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
