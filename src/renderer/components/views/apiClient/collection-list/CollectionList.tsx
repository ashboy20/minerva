import React, { useEffect, useMemo } from 'react';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import {
	Collection,
	Endpoint,
	Folder,
	getCollections,
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
): MinervaNodeModel[] => {
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

			// Process collection items recursively
			if (collection.items && collection.items.length > 0) {
				treeData.push(
					...parseTreeData(
						collection.items,
						collection.uuid,
					),
				);
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

			// Process folder items recursively
			if (folder.items && folder.items.length > 0) {
				treeData.push(
					...parseTreeData(folder.items, folder.uuid),
				);
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

	return treeData;
};

export function CollectionList() {
	const dispatch = useAppDispatch();

	const { collections, loading, error } = useAppSelector(
		(state) => state.newCollections,
	);

	// Compute tree data from collections using useMemo
	const treeData = useMemo(
		() => parseTreeData(collections),
		[collections],
	);

	// TODO: Move openIds to newCollectionSlice
	const [openIds, setOpenIdsLocal] = React.useState<
		string[]
	>([]);

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
		// TODO: Implement createBlankCollection in newCollectionSlice
		console.log('TODO: Create blank collection');
		// dispatch(createBlankCollection());
		// dispatch(getCollections());
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

	const handleDrop = (
		newTree: NodeModel<any>[],
		options: DropOptions<any>,
	) => {
		// TODO: Implement reorder in newCollectionSlice
		console.log('TODO: Reorder items', {
			draggedUuid: options.dragSource?.id,
			oldParentUuid: options.dragSource?.parent,
			newParentUuid: options.dropTarget?.id,
			relativeIndex: options.relativeIndex,
		});

		// TODO: Refresh collections after reorder
		// dispatch(getCollections());
	};

	const handleChangeOpen = (
		newOpenIds: NodeModel['id'][],
	) => {
		const stringIds = newOpenIds.map((id) => String(id));
		setOpenIdsLocal(stringIds);

		// TODO: Persist openIds to storage
		console.log('TODO: Save openIds to storage', stringIds);
	};

	const handleCreateItem = async (
		name: string,
		type: 'folder' | 'endpoint',
		parentUuid: string,
	) => {
		// TODO: Implement createItem in newCollectionSlice
		console.log('TODO: Create item', {
			name,
			type,
			parentUuid,
			...(type === 'endpoint' && {
				method: 'GET',
				url: '',
			}),
		});

		// TODO: Update openIds if needed
		// TODO: Refresh collections after creation
		return false;
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
		</div>
	);
}
