import React from 'react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
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
import { Card, CardContent } from '@/renderer/components/ui/card';
import { Textarea } from '@/renderer/components/ui/textarea';
import { PlayIcon, BookmarkIcon } from '@radix-ui/react-icons';
import { TableForm } from '@/renderer/components/views/apiClient/components/InputTable';
import { MethodText } from '@/renderer/components/common-ui/MethodText';
import { HTTP_METHODS } from '@/data/apiClient';

interface Row {
	id: number;
	keyValue: string;
	value: string;
	enabled: boolean;
}

interface RequestSectionProps {
	method: string;
	url: string;
	params: Row[];
	headers: Row[];
	body: string;
	authType: string;
	activeTab: string;
	loading: boolean;
	onMethodChange: (method: string) => void;
	onUrlChange: (url: string) => void;
	onBodyChange: (body: string) => void;
	onAuthTypeChange: (authType: string) => void;
	onActiveTabChange: (tab: string) => void;
	onSendRequest: () => void;
}

export function RequestSection({
	method,
	url,
	params,
	headers,
	body,
	authType,
	activeTab,
	loading,
	onMethodChange,
	onUrlChange,
	onBodyChange,
	onAuthTypeChange,
	onActiveTabChange,
	onSendRequest,
}: RequestSectionProps) {
	return (
		<div className="h-full p-4 overflow-y-auto">
			<Card className="h-full border-none flex flex-col">
				<CardContent className="space-y-4 p-4 flex-1 flex flex-col">
					{/* URL Bar */}
					<div className="flex space-x-2">
						<Select value={method} onValueChange={onMethodChange}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{HTTP_METHODS.map((m) => (
									<SelectItem key={m} value={m}>
										<MethodText method={m} />
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							placeholder="Enter request URL"
							value={url}
							onChange={(e) => onUrlChange(e.target.value)}
							className="flex-1"
						/>
						<Button
							onClick={onSendRequest}
							disabled={loading || !url.trim()}
							className="px-6"
						>
							{loading ? (
								<>Sending...</>
							) : (
								<>
									<PlayIcon className="w-4 h-4 mr-2" />
									Send
								</>
							)}
						</Button>
					</div>

					{/* Request Configuration Tabs */}
					<Tabs
						value={activeTab}
						onValueChange={onActiveTabChange}
						className="flex-1 flex flex-col"
					>
						<TabsList className="grid w-full grid-cols-6">
							<TabsTrigger value="params">Params</TabsTrigger>
							<TabsTrigger value="headers">Headers</TabsTrigger>
							<TabsTrigger value="body">Body</TabsTrigger>
							<TabsTrigger value="auth">Auth</TabsTrigger>
							<TabsTrigger value="pre-request-scripts">
								Pre-Request Scripts
							</TabsTrigger>
							<TabsTrigger value="tests">Tests</TabsTrigger>
						</TabsList>
						<TabsContent value="params" className="space-y-2 flex-1">
							<TableForm rows={params} />
						</TabsContent>
						<TabsContent value="headers" className="space-y-2 flex-1">
							<TableForm rows={headers} />
						</TabsContent>
						<TabsContent
							value="body"
							className="space-y-2 flex-1 flex flex-col"
						>
							<Textarea
								placeholder="Enter request body (JSON, XML, etc.)"
								value={body}
								onChange={(e) => onBodyChange(e.target.value)}
								className="font-mono text-sm flex-1 resize-none"
								disabled={method === 'GET' || method === 'HEAD'}
							/>
							{(method === 'GET' || method === 'HEAD') && (
								<p className="text-sm text-muted-foreground">
									Body is not applicable for {method} requests
								</p>
							)}
						</TabsContent>
						<TabsContent value="auth" className="flex-1 flex items-start">
							<div className="flex flex-col gap-2 w-full">
								<Select value={authType} onValueChange={onAuthTypeChange}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Bearer">Bearer</SelectItem>
									</SelectContent>
								</Select>
								<Input placeholder="put token here" type="password" />
							</div>
						</TabsContent>
						{/* TODO: create content for pre-request scripts and tests */}
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
