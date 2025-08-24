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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/renderer/components/ui/select';
import { Badge } from '@/renderer/components/ui/badge';
import { Separator } from '@/renderer/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/renderer/components/ui/table';
import {
	ClockIcon,
	MagnifyingGlassIcon,
	TrashIcon,
	PlayIcon,
	DownloadIcon,
	DotsHorizontalIcon,
} from '@radix-ui/react-icons';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';

interface HistoryEntry {
	id: string;
	method: string;
	url: string;
	status: number;
	statusText: string;
	responseTime: number;
	timestamp: Date;
	requestSize: number;
	responseSize: number;
}

const sampleHistory: HistoryEntry[] = [
	{
		id: '1',
		method: 'GET',
		url: 'https://jsonplaceholder.typicode.com/posts',
		status: 200,
		statusText: 'OK',
		responseTime: 245,
		timestamp: new Date('2024-01-25T10:30:00'),
		requestSize: 0,
		responseSize: 15680,
	},
	{
		id: '2',
		method: 'POST',
		url: 'https://jsonplaceholder.typicode.com/posts',
		status: 201,
		statusText: 'Created',
		responseTime: 189,
		timestamp: new Date('2024-01-25T10:25:00'),
		requestSize: 156,
		responseSize: 89,
	},
	{
		id: '3',
		method: 'GET',
		url: 'https://jsonplaceholder.typicode.com/posts/1',
		status: 200,
		statusText: 'OK',
		responseTime: 134,
		timestamp: new Date('2024-01-25T10:20:00'),
		requestSize: 0,
		responseSize: 292,
	},
	{
		id: '4',
		method: 'PUT',
		url: 'https://jsonplaceholder.typicode.com/posts/1',
		status: 200,
		statusText: 'OK',
		responseTime: 298,
		timestamp: new Date('2024-01-25T10:15:00'),
		requestSize: 178,
		responseSize: 292,
	},
	{
		id: '5',
		method: 'DELETE',
		url: 'https://jsonplaceholder.typicode.com/posts/1',
		status: 200,
		statusText: 'OK',
		responseTime: 167,
		timestamp: new Date('2024-01-25T10:10:00'),
		requestSize: 0,
		responseSize: 0,
	},
	{
		id: '6',
		method: 'GET',
		url: 'https://api.github.com/users/octocat',
		status: 404,
		statusText: 'Not Found',
		responseTime: 456,
		timestamp: new Date('2024-01-25T10:05:00'),
		requestSize: 0,
		responseSize: 145,
	},
];

export function History() {
	const [history, setHistory] = useState<HistoryEntry[]>(sampleHistory);
	const [searchQuery, setSearchQuery] = useState('');
	const [methodFilter, setMethodFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	const getMethodColor = (method: string) => {
		switch (method.toUpperCase()) {
			case 'GET': return 'bg-green-500';
			case 'POST': return 'bg-blue-500';
			case 'PUT': return 'bg-orange-500';
			case 'PATCH': return 'bg-yellow-500';
			case 'DELETE': return 'bg-red-500';
			default: return 'bg-gray-500';
		}
	};

	const getStatusColor = (status: number) => {
		if (status >= 200 && status < 300) return 'bg-green-500';
		if (status >= 300 && status < 400) return 'bg-yellow-500';
		if (status >= 400 && status < 500) return 'bg-orange-500';
		if (status >= 500) return 'bg-red-500';
		return 'bg-gray-500';
	};

	const formatDate = (date: Date) => {
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	};

	const filteredHistory = history.filter(entry => {
		const matchesSearch = entry.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
			entry.statusText.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesMethod = methodFilter === 'all' || entry.method === methodFilter;
		const matchesStatus = statusFilter === 'all' ||
			(statusFilter === '2xx' && entry.status >= 200 && entry.status < 300) ||
			(statusFilter === '3xx' && entry.status >= 300 && entry.status < 400) ||
			(statusFilter === '4xx' && entry.status >= 400 && entry.status < 500) ||
			(statusFilter === '5xx' && entry.status >= 500);

		return matchesSearch && matchesMethod && matchesStatus;
	});

	const clearHistory = () => {
		setHistory([]);
	};

	const deleteEntry = (id: string) => {
		setHistory(history.filter(entry => entry.id !== id));
	};

	const exportHistory = () => {
		const dataStr = JSON.stringify(filteredHistory, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });

		const link = document.createElement('a');
		link.href = URL.createObjectURL(dataBlob);
		link.download = 'api-history.json';
		link.click();
	};

	// Calculate stats
	const totalRequests = history.length;
	const successfulRequests = history.filter(h => h.status >= 200 && h.status < 400).length;
	const averageResponseTime = totalRequests > 0
		? Math.round(history.reduce((sum, h) => sum + h.responseTime, 0) / totalRequests)
		: 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Request History</h1>
					<p className="text-muted-foreground">
						Track and review your API request history
					</p>
				</div>
				<div className="flex space-x-2">
					<Button variant="outline" onClick={exportHistory}>
						<DownloadIcon className="w-4 h-4 mr-2" />
						Export
					</Button>
					<Button variant="outline" onClick={clearHistory}>
						<TrashIcon className="w-4 h-4 mr-2" />
						Clear All
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Requests
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalRequests}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Success Rate
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0}%
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Avg Response Time
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-blue-600">
							{averageResponseTime}ms
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<Label htmlFor="search">Search</Label>
							<div className="relative">
								<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
								<Input
									id="search"
									placeholder="Search by URL or status..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div>
							<Label>Method</Label>
							<Select value={methodFilter} onValueChange={setMethodFilter}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Methods</SelectItem>
									<SelectItem value="GET">GET</SelectItem>
									<SelectItem value="POST">POST</SelectItem>
									<SelectItem value="PUT">PUT</SelectItem>
									<SelectItem value="PATCH">PATCH</SelectItem>
									<SelectItem value="DELETE">DELETE</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>Status</Label>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-32">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="2xx">2xx Success</SelectItem>
									<SelectItem value="3xx">3xx Redirect</SelectItem>
									<SelectItem value="4xx">4xx Client Error</SelectItem>
									<SelectItem value="5xx">5xx Server Error</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* History Table */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">
						History ({filteredHistory.length} {filteredHistory.length === 1 ? 'entry' : 'entries'})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{filteredHistory.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							<ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
							<p className="text-lg font-medium">No history entries</p>
							<p className="text-sm">Your API request history will appear here</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Method</TableHead>
										<TableHead>URL</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Time</TableHead>
										<TableHead>Size</TableHead>
										<TableHead>Timestamp</TableHead>
										<TableHead className="w-10"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredHistory.map((entry) => (
										<TableRow key={entry.id} className="hover:bg-muted/50">
											<TableCell>
												<Badge className={`${getMethodColor(entry.method)} text-white`}>
													{entry.method}
												</Badge>
											</TableCell>
											<TableCell className="font-medium max-w-md truncate">
												{entry.url}
											</TableCell>
											<TableCell>
												<Badge className={`${getStatusColor(entry.status)} text-white`}>
													{entry.status} {entry.statusText}
												</Badge>
											</TableCell>
											<TableCell className="text-muted-foreground">
												{entry.responseTime}ms
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatBytes(entry.responseSize)}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{formatDate(entry.timestamp)}
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="sm">
															<DotsHorizontalIcon className="w-4 h-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem>
															<PlayIcon className="w-4 h-4 mr-2" />
															Repeat Request
														</DropdownMenuItem>
														<DropdownMenuItem>
															Save to Collection
														</DropdownMenuItem>
														<Separator className="my-1" />
														<DropdownMenuItem
															className="text-destructive"
															onClick={() => deleteEntry(entry.id)}
														>
															<TrashIcon className="w-4 h-4 mr-2" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
