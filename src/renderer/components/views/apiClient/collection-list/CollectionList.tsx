import React, {
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import {
	Collection,
	Endpoint,
	Folder,
	getCollections,
	reorderCollectionItem,
	toggleItemOpenState,
	createCollection,
	createFolder,
	createEndpoint,
} from '@/store/slices/collectionSlice';
import { CollectionHeader } from '@/renderer/components/views/apiClient/collection-list/CollectionHeader';
import { DndProvider } from 'react-dnd';
import {
	Tree,
	getBackendOptions,
	MultiBackend,
	NodeModel,
	DropOptions,
} from '@minoru/react-dnd-treeview';
import {
	useAppDispatch,
	useAppSelector,
} from '@/store/hooks';
import { TreeItem } from '@/renderer/components/views/apiClient/collection-list/TreeItem';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Label } from '@/renderer/components/ui/label';

export interface MinervaNodeModel extends NodeModel<any> {
	data: {
		type: string | 'collection' | 'folder' | 'endpoint';
		isEditing?: boolean;
		method?: string;
		url?: string;
	};
}

const parseTreeData = (
	items: (Collection | Folder | Endpoint)[],
	parentId: string | number = 0,
	openIds: string[] = [],
): { treeData: MinervaNodeModel[]; openIds: string[] } => {
	const treeData: MinervaNodeModel[] = [];

	items.forEach((item) => {
		// Handle collections (from local files)
		if ('type' in item && item.type === 'collection') {
			const collection = item as Collection;
			const collectionNode = {
				id: collection.uuid,
				parent: parentId,
				droppable: true,
				text: collection.name,
				data: {
					type: 'collection' as const,
					isEditing: false,
				},
			};
			treeData.push(collectionNode);

			// Add to openIds if is_opened is true
			if (collection.is_opened) {
				openIds.push(collection.uuid);
			}

			// Process collection items recursively
			if (collection.items && collection.items.length > 0) {
				const result = parseTreeData(
					collection.items,
					collection.uuid,
					openIds,
				);
				treeData.push(...result.treeData);
			}
		}
		// Handle folders (from local files)
		else if ('type' in item && item.type === 'folder') {
			const folder = item as Folder;
			const folderNode = {
				id: folder.uuid,
				parent: parentId,
				droppable: true,
				text: folder.name,
				data: {
					type: 'folder' as const,
					isEditing: false,
				},
			};
			treeData.push(folderNode);

			// Add to openIds if is_opened is true
			if (folder.is_opened) {
				openIds.push(folder.uuid);
			}

			// Process folder items recursively
			if (folder.items && folder.items.length > 0) {
				const result = parseTreeData(
					folder.items,
					folder.uuid,
					openIds,
				);
				treeData.push(...result.treeData);
			}
		}
		// Handle endpoints (from local files)
		else if ('type' in item && item.type === 'endpoint') {
			const endpoint = item as Endpoint;
			const endpointNode = {
				id: endpoint.uuid,
				parent: parentId,
				droppable: false,
				text:
					endpoint.name ||
					endpoint.url ||
					'Untitled Endpoint',
				data: {
					type: 'endpoint' as const,
					isEditing: false,
					method: endpoint.method || 'GET',
					url: endpoint.url || '',
				},
			};
			treeData.push(endpointNode);
		}
	});

	return { treeData, openIds };
};

export function CollectionList() {
	const dispatch = useAppDispatch();

	const {
		collections,
		loading,
		error,
		creating,
		createError,
	} = useAppSelector((state) => state.collection);

	// Dialog state
	const [isCreateDialogOpen, setIsCreateDialogOpen] =
		useState(false);
	const [newCollectionName, setNewCollectionName] =
		useState('');
	const [validationError, setValidationError] = useState<
		string | null
	>(null);

	// Compute tree data and initial open IDs from collections using useMemo
	const { treeData, openIds: initialOpenIds } = useMemo(
		() => parseTreeData(collections),
		[collections],
	);

	// TODO: Move openIds to newCollectionSlice
	const [openIds, setOpenIdsLocal] = React.useState<
		string[]
	>([]);

	// Track previous openIds for debounced sync
	const previousOpenIdsRef = useRef<string[]>([]);

	// Debounced function to sync open states to backend
	const debouncedSyncOpenState =
		useRef<NodeJS.Timeout | null>(null);

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debouncedSyncOpenState.current) {
				clearTimeout(debouncedSyncOpenState.current);
			}
		};
	}, []);

	// Initialize openIds from parsed data when collections load
	React.useEffect(() => {
		if (initialOpenIds.length > 0) {
			setOpenIdsLocal(initialOpenIds);
			previousOpenIdsRef.current = initialOpenIds;
		}
	}, [initialOpenIds]);

	// Fetch collections on mount
	useEffect(() => {
		dispatch(getCollections())
			.unwrap()
			.then((result) => {
				console.log(
					'Collections fetched successfully:',
					result,
				);
			})
			.catch((error) => {
				console.error(
					'Failed to fetch collections:',
					error,
				);
			});

		// TODO: Load initial open state from persistence
		console.log('TODO: Load openIds from storage');
	}, [dispatch]);

	const handleCreateCollection = () => {
		setIsCreateDialogOpen(true);
		setNewCollectionName('');
		setValidationError(null);
	};

	const handleCreateDialogClose = () => {
		setIsCreateDialogOpen(false);
		setNewCollectionName('');
		setValidationError(null);
	};

	const handleCreateSubmit = async () => {
		// Validate input
		if (!newCollectionName.trim()) {
			setValidationError('Collection name cannot be empty');
			return;
		}

		// Check if name contains at least one alphanumeric character
		const hasAlphanumeric = /[a-z0-9]/i.test(
			newCollectionName,
		);
		if (!hasAlphanumeric) {
			setValidationError(
				'Collection name must contain at least one alphanumeric character',
			);
			return;
		}

		try {
			// Create the collection
			await dispatch(
				createCollection({ name: newCollectionName }),
			).unwrap();

			// Refresh collections list
			await dispatch(getCollections()).unwrap();

			// Close dialog on success
			handleCreateDialogClose();

			console.log('Collection created successfully');
		} catch (error) {
			console.error('Failed to create collection:', error);
			// Extract the actual error message from the error object
			const errorMessage =
				typeof error === 'string'
					? error
					: (error as any)?.message || String(error);
			setValidationError(errorMessage);
		}
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
	) => {
		if (e.key === 'Enter') {
			handleCreateSubmit();
		}
	};

	const handleCanDrop = (
		tree: NodeModel<any>[],
		{ dragSource, dropTargetId }: DropOptions<any>,
	) => {
		// If no drag source, drop is not allowed
		if (!dragSource) return false;

		// Get the dragged item's data
		const draggedItem = tree.find(
			(item) => item.id === dragSource.id,
		);
		if (!draggedItem) return false;

		// Get the drop target item
		const dropTarget = tree.find(
			(item) => item.id === dropTargetId,
		);

		// If dropping at root level (reordering collections)
		if (dropTargetId === 0) {
			return draggedItem.data?.type === 'collection';
		}

		// If no drop target found but not root, disallow drop
		if (!dropTarget) return false;

		const dragType = draggedItem.data?.type;
		const dropType = dropTarget.data?.type;

		// Rules for different item types:
		switch (dragType) {
			case 'endpoint':
				// Endpoints can be dropped in folders or collections
				return (
					dropType === 'folder' ||
					dropType === 'collection' ||
					// Or reordered within current parent
					dragSource.parent === dropTargetId
				);

			case 'folder':
				// Folders can be dropped in collections or other folders
				return (
					dropType === 'folder' ||
					dropType === 'collection' ||
					// Or reordered within current parent
					dragSource.parent === dropTargetId
				);

			case 'collection':
				// Collections can only be reordered at root level
				return dropTargetId === 0;

			default:
				return false;
		}
	};

	const handleDrop = async (
		newTree: NodeModel<any>[],
		options: DropOptions<any>,
	) => {
		if (!options.dragSource || !options.dropTargetId) {
			console.error(
				'Invalid drop operation: missing drag source or drop target',
			);
			return;
		}

		const draggedUuid = options.dragSource.id as string;
		const destinationParentUuid =
			options.dropTargetId === 0
				? null
				: (options.dropTargetId as string);
		const destinationSeq = options.destinationIndex ?? 0;

		console.log('Reorder operation:', {
			itemUuid: draggedUuid,
			destinationFolderUuid: destinationParentUuid,
			destinationSeq,
		});

		try {
			// Call the reorder thunk
			await dispatch(
				reorderCollectionItem({
					itemUuid: draggedUuid,
					destinationFolderUuid: destinationParentUuid,
					destinationSeq,
				}),
			).unwrap();

			// Refresh collections after successful reorder
			await dispatch(getCollections()).unwrap();

			console.log('Reorder completed successfully');
		} catch (error) {
			console.error('Failed to reorder item:', error);
		}
	};

	const handleChangeOpen = (
		newOpenIds: NodeModel['id'][],
	) => {
		const stringIds = newOpenIds.map((id) => String(id));
		const previousIds = previousOpenIdsRef.current;

		// 1. Update UI immediately (optimistic update)
		setOpenIdsLocal(stringIds);

		// 2. Calculate what changed
		const addedIds = stringIds.filter(
			(id) => !previousIds.includes(id),
		);
		const removedIds = previousIds.filter(
			(id) => !stringIds.includes(id),
		);

		// Update ref
		previousOpenIdsRef.current = stringIds;

		// 3. Cancel previous pending sync
		if (debouncedSyncOpenState.current) {
			clearTimeout(debouncedSyncOpenState.current);
		}

		// 4. Debounced backend sync (500ms after last change)
		if (addedIds.length > 0 || removedIds.length > 0) {
			debouncedSyncOpenState.current = setTimeout(
				async () => {
					try {
						// Sync all changes to backend
						await Promise.all([
							...addedIds.map((uuid) =>
								dispatch(
									toggleItemOpenState({
										uuid,
										isOpened: true,
									}),
								).unwrap(),
							),
							...removedIds.map((uuid) =>
								dispatch(
									toggleItemOpenState({
										uuid,
										isOpened: false,
									}),
								).unwrap(),
							),
						]);

						console.log(
							'Open states synced to backend successfully',
						);
					} catch (error) {
						console.error(
							'Failed to sync open states:',
							error,
						);
						// Optionally: revert UI on error or show notification
					}
				},
				500,
			);
		}
	};

	const handleCreateItem = async (
		name: string,
		type: 'folder' | 'endpoint',
		parentUuid: string,
	) => {
		try {
			if (type === 'folder') {
				await dispatch(
					createFolder({
						name,
						parentUuid,
					}),
				).unwrap();
				console.log('Folder created successfully');
			} else if (type === 'endpoint') {
				await dispatch(
					createEndpoint({
						name,
						parentUuid,
						method: 'GET',
						baseUrl: 'http://localhost:8000',
						path: '/',
					}),
				).unwrap();
				console.log('Endpoint created successfully');
			}

			// Refresh collections after creation
			await dispatch(getCollections()).unwrap();
			return true;
		} catch (error) {
			console.error('Failed to create item:', error);
			return false;
		}
	};

	// Header at the top
	const header = (
		<CollectionHeader
			onCreateCollection={handleCreateCollection}
		/>
	);

	// Content based on state
	let content;
	if (loading) {
		content = (
			<CardContent className="flex h-32 items-center justify-center p-0">
				<div className="text-sm text-muted-foreground">
					Loading collections...
				</div>
			</CardContent>
		);
	} else if (error) {
		content = (
			<CardContent className="flex h-32 items-center justify-center p-0">
				<div className="text-sm text-red-500">
					Error: {error}
				</div>
			</CardContent>
		);
	} else {
		content = (
			<CardContent className="p-0">
				<div className="space-y-1">
					{collections.length === 0 ? (
						<div className="py-8 text-center text-sm text-muted-foreground">
							No collections found
						</div>
					) : (
						<>
							<DndProvider
								backend={MultiBackend}
								options={getBackendOptions()}
							>
								<Tree
									tree={treeData}
									rootId={0}
									onDrop={handleDrop}
									sort={false}
									enableAnimateExpand
									canDrop={handleCanDrop}
									dropTargetOffset={5}
									placeholderRender={(node, { depth }) => (
										<div
											className="h-[2px] w-full bg-blue-600 bg-muted"
											key={node.id}
										/>
									)}
									dragPreviewRender={(monitorProps) => (
										<div style={{ opacity: 0.5 }}>
											<TreeItem
												node={
													monitorProps.item as MinervaNodeModel
												}
												depth={0}
												isOpen={false}
												onToggle={() => {}}
												onCreateItem={handleCreateItem}
											/>
										</div>
									)}
									render={(
										node,
										{
											depth,
											isOpen,
											onToggle,
											isDragging,
											isDropTarget,
										},
									) => (
										<TreeItem
											node={node as MinervaNodeModel}
											depth={depth}
											isOpen={isOpen}
											onToggle={onToggle}
											isDragging={isDragging}
											isDropTarget={isDropTarget}
											onCreateItem={handleCreateItem}
										/>
									)}
									onChangeOpen={handleChangeOpen}
									initialOpen={openIds}
								/>
							</DndProvider>
						</>
					)}
				</div>
			</CardContent>
		);
	}

	return (
		<div className="h-full border-r p-4">
			<Card className="h-full border-none">
				{header}
				{content}
			</Card>

			{/* Create Collection Dialog */}
			<Dialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Collection</DialogTitle>
						<DialogDescription>
							Enter a name for your new collection. You can
							organize your API requests in it.
						</DialogDescription>
					</DialogHeader>

					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="collection-name">
								Collection Name
							</Label>
							<Input
								id="collection-name"
								placeholder="My API Collection"
								value={newCollectionName}
								onChange={(e) => {
									setNewCollectionName(e.target.value);
									setValidationError(null);
								}}
								onKeyDown={handleKeyDown}
								disabled={creating}
								autoFocus
							/>
							{validationError && (
								<p className="text-sm text-red-500">
									{validationError}
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCreateDialogClose}
							disabled={creating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateSubmit}
							disabled={
								creating || !newCollectionName.trim()
							}
						>
							{creating
								? 'Creating...'
								: 'Create Collection'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
