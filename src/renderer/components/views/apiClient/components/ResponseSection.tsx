import React from 'react';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { CopyIcon, PlayIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';

interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	data: any;
	time: number;
	size: number;
}

interface ResponseSectionProps {
	response: ApiResponse | null;
}

export function ResponseSection({
	response,
}: ResponseSectionProps) {
	const getStatusColor = (status: number) => {
		if (status >= 200 && status < 300)
			return 'bg-green-500';
		if (status >= 300 && status < 400)
			return 'bg-yellow-500';
		if (status >= 400 && status < 500)
			return 'bg-orange-500';
		if (status >= 500) return 'bg-red-500';
		return 'bg-gray-500';
	};

	const handleCopy = () => {
		if (response) {
			navigator.clipboard.writeText(
				JSON.stringify(response.data, null, 2),
			);
		}
	};

	return (
		<div className="h-full overflow-y-auto p-4">
			{response && (
				<Card className="h-full border-none">
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Response</CardTitle>
							<div className="flex items-center space-x-4 text-sm">
								<Badge
									className={`${getStatusColor(response.status)} text-white`}
								>
									{response.status} {response.statusText}
								</Badge>
								<span className="text-muted-foreground">
									Time: {response.time}ms
								</span>
								<span className="text-muted-foreground">
									Size: {(response.size / 1024).toFixed(2)}{' '}
									KB
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="body" className="h-full">
							<TabsList>
								<TabsTrigger value="body">Body</TabsTrigger>
								<TabsTrigger value="headers">
									Headers
								</TabsTrigger>
							</TabsList>
							<TabsContent value="body" className="mt-4">
								<div className="flex justify-end">
									<Button
										size="sm"
										className="px-2"
										onClick={handleCopy}
									>
										<CopyIcon />
									</Button>
								</div>
								<div className="max-h-screen overflow-auto rounded-md bg-muted p-4">
									<pre className="whitespace-pre-wrap font-mono text-sm">
										{typeof response.data === 'object'
											? JSON.stringify(
													response.data,
													null,
													2,
												)
											: response.data}
									</pre>
								</div>
							</TabsContent>

							<TabsContent value="headers" className="mt-4">
								<div className="max-h-96 space-y-2 overflow-auto">
									{Object.entries(response.headers).map(
										([key, value]) => (
											<div
												key={key}
												className="flex items-start justify-between border-b py-1"
											>
												<span className="text-sm font-medium">
													{key}:
												</span>
												<span className="ml-4 break-all text-sm text-muted-foreground">
													{value}
												</span>
											</div>
										),
									)}
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			)}

			{!response && (
				<Card className="flex h-full items-center justify-center border-none">
					<CardContent>
						<div className="text-center text-muted-foreground">
							<PlayIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
							<p>Send a request to see the response here</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
