import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/renderer/components/ui/tabs';
import { PlayIcon } from '@radix-ui/react-icons';

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

export function ResponseSection({ response }: ResponseSectionProps) {
	const getStatusColor = (status: number) => {
		if (status >= 200 && status < 300) return 'bg-green-500';
		if (status >= 300 && status < 400) return 'bg-yellow-500';
		if (status >= 400 && status < 500) return 'bg-orange-500';
		if (status >= 500) return 'bg-red-500';
		return 'bg-gray-500';
	};

	return (
		<div className="h-full p-4 overflow-y-auto">
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
									Size: {(response.size / 1024).toFixed(2)} KB
								</span>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="body" className="h-full">
							<TabsList>
								<TabsTrigger value="body">Body</TabsTrigger>
								<TabsTrigger value="headers">Headers</TabsTrigger>
							</TabsList>

							<TabsContent value="body" className="mt-4">
								<div className="bg-muted rounded-md p-4 max-h-96 overflow-auto">
									<pre className="text-sm font-mono whitespace-pre-wrap">
										{typeof response.data === 'object'
											? JSON.stringify(response.data, null, 2)
											: response.data}
									</pre>
								</div>
							</TabsContent>

							<TabsContent value="headers" className="mt-4">
								<div className="space-y-2 max-h-96 overflow-auto">
									{Object.entries(response.headers).map(
										([key, value]) => (
											<div
												key={key}
												className="flex justify-between items-start py-1 border-b"
											>
												<span className="font-medium text-sm">
													{key}:
												</span>
												<span className="text-sm text-muted-foreground ml-4 break-all">
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
				<Card className="h-full flex items-center justify-center border-none">
					<CardContent>
						<div className="text-center text-muted-foreground">
							<PlayIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
							<p>Send a request to see the response here</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
