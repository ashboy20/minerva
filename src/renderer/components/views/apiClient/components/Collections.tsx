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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/renderer/components/ui/dialog';
import { Badge } from '@/renderer/components/ui/badge';
import { Separator } from '@/renderer/components/ui/separator';
import {
	PlusIcon,
	FileTextIcon,
	TrashIcon,
	PlayIcon,
	DotsVerticalIcon,
	ArchiveIcon,
} from '@radix-ui/react-icons';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';

interface SavedRequest {
	id: string;
	name: string;
	method: string;
	url: string;
	description?: string;
	createdAt: Date;
}

interface Collection {
	id: string;
	name: string;
	description: string;
	requests: SavedRequest[];
	createdAt: Date;
}

const sampleCollections: Collection[] = [
	{
		id: '1',
		name: 'JSONPlaceholder API',
		description: 'Test requests for JSONPlaceholder API',
		createdAt: new Date('2024-01-15'),
		requests: [
			{
				id: '1',
				name: 'Get All Posts',
				method: 'GET',
				url: 'https://jsonplaceholder.typicode.com/posts',
				description: 'Fetch all posts from the API',
				createdAt: new Date('2024-01-15'),
			},
			{
				id: '2',
				name: 'Get Single Post',
				method: 'GET',
				url: 'https://jsonplaceholder.typicode.com/posts/1',
				description: 'Fetch a specific post by ID',
				createdAt: new Date('2024-01-15'),
			},
			{
				id: '3',
				name: 'Create Post',
				method: 'POST',
				url: 'https://jsonplaceholder.typicode.com/posts',
				description: 'Create a new post',
				createdAt: new Date('2024-01-16'),
			},
		],
	},
	{
		id: '2',
		name: 'Authentication API',
		description: 'User authentication and authorization requests',
		createdAt: new Date('2024-01-20'),
		requests: [
			{
				id: '4',
				name: 'User Login',
				method: 'POST',
				url: 'https://api.example.com/auth/login',
				description: 'Authenticate user credentials',
				createdAt: new Date('2024-01-20'),
			},
			{
				id: '5',
				name: 'Get User Profile',
				method: 'GET',
				url: 'https://api.example.com/user/profile',
				description: 'Get authenticated user profile',
				createdAt: new Date('2024-01-20'),
			},
		],
	},
];

export function Collections() {
	const [collections, setCollections] = useState<Collection[]>(sampleCollections);
	const [newCollectionName, setNewCollectionName] = useState('');
	const [newCollectionDescription, setNewCollectionDescription] = useState('');
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

	const createCollection = () => {
		if (!newCollectionName.trim()) return;

		const newCollection: Collection = {
			id: Date.now().toString(),
			name: newCollectionName,
			description: newCollectionDescription,
			requests: [],
			createdAt: new Date(),
		};

		setCollections([...collections, newCollection]);
		setNewCollectionName('');
		setNewCollectionDescription('');
		setIsCreateDialogOpen(false);
	};

	const deleteCollection = (collectionId: string) => {
		setCollections(collections.filter(c => c.id !== collectionId));
	};

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

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Collections</h1>
					<p className="text-muted-foreground">
						Organize your API requests into collections
					</p>
				</div>
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<PlusIcon className="w-4 h-4 mr-2" />
							New Collection
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Collection</DialogTitle>
							<DialogDescription>
								Create a new collection to organize your API requests.
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									placeholder="Enter collection name"
									value={newCollectionName}
									onChange={(e) => setNewCollectionName(e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="description">Description</Label>
								<Input
									id="description"
									placeholder="Enter collection description"
									value={newCollectionDescription}
									onChange={(e) => setNewCollectionDescription(e.target.value)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsCreateDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button onClick={createCollection} disabled={!newCollectionName.trim()}>
								Create Collection
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Collections Grid */}
			{collections.length === 0 ? (
				<Card className="flex items-center justify-center h-64">
					<CardContent>
						<div className="text-center text-muted-foreground">
							<ArchiveIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
							<p className="text-lg font-medium">No collections yet</p>
							<p className="text-sm">Create your first collection to get started</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{collections.map((collection) => (
						<Card key={collection.id} className="hover:shadow-md transition-shadow">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center space-x-2">
										<ArchiveIcon className="w-5 h-5 text-muted-foreground" />
										<CardTitle className="text-lg">{collection.name}</CardTitle>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<DotsVerticalIcon className="w-4 h-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem>Edit Collection</DropdownMenuItem>
											<DropdownMenuItem>Duplicate</DropdownMenuItem>
											<DropdownMenuItem>Export</DropdownMenuItem>
											<Separator className="my-1" />
											<DropdownMenuItem
												className="text-destructive"
												onClick={() => deleteCollection(collection.id)}
											>
												<TrashIcon className="w-4 h-4 mr-2" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<CardDescription>{collection.description}</CardDescription>
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<span>{collection.requests.length} requests</span>
									<span>Created {formatDate(collection.createdAt)}</span>
								</div>
							</CardHeader>

							{collection.requests.length > 0 && (
								<CardContent className="pt-0">
									<div className="space-y-2">
										<Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
											Recent Requests
										</Label>
										<div className="space-y-1">
											{collection.requests.slice(0, 3).map((request) => (
												<div
													key={request.id}
													className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
												>
													<div className="flex items-center space-x-2 flex-1 min-w-0">
														<Badge
															className={`${getMethodColor(request.method)} text-white text-xs px-1.5 py-0.5`}
														>
															{request.method}
														</Badge>
														<span className="text-sm font-medium truncate">
															{request.name}
														</span>
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="opacity-0 group-hover:opacity-100 transition-opacity"
													>
														<PlayIcon className="w-3 h-3" />
													</Button>
												</div>
											))}
											{collection.requests.length > 3 && (
												<div className="text-xs text-muted-foreground text-center pt-1">
													+{collection.requests.length - 3} more requests
												</div>
											)}
										</div>
									</div>
								</CardContent>
							)}

							{collection.requests.length === 0 && (
								<CardContent className="pt-0">
									<div className="text-center text-muted-foreground py-4">
										<FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No requests in this collection</p>
									</div>
								</CardContent>
							)}
						</Card>
					))}
				</div>
			)}

			{/* Summary Stats */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Collection Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{collections.length}
							</div>
							<div className="text-sm text-muted-foreground">Collections</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{collections.reduce((total, c) => total + c.requests.length, 0)}
							</div>
							<div className="text-sm text-muted-foreground">Total Requests</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-purple-600">
								{collections.reduce((total, c) => total + c.requests.filter(r => r.method === 'GET').length, 0)}
							</div>
							<div className="text-sm text-muted-foreground">GET Requests</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-orange-600">
								{collections.reduce((total, c) => total + c.requests.filter(r => r.method === 'POST').length, 0)}
							</div>
							<div className="text-sm text-muted-foreground">POST Requests</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
