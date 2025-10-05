import React, { useEffect, useState } from 'react';
import {
	Card,
	CardContent,
} from '@/renderer/components/ui/card';
import {
	Collection,
	Endpoint,
	Folder,
	reorder,
	createItem,
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
import {
	loadOpenIds,
	setOpenIds,
} from '@/store/slices/collectionSlice';
import { useGlobalContext } from '@/renderer/context/global-context';

export interface MinervaNodeModel extends NodeModel<any> {
	data: {
		type: string | 'collection' | 'folder' | 'endpoint';
		isEditing?: boolean;
		method?: string;
		url?: string;
	};
}

const parseTreeData = (
	items: Collection[] | (Folder | Endpoint)[],
	parentId: string | number = 0,
) => {
	const treeData: MinervaNodeModel[] = [];

	items.forEach((item) => {
		// Handle collections
		if (item.type === 'collection') {
			const collectionNode = {
				id: item.uuid,
				parent: parentId,
				droppable: true,
				text: item.name,
				data: {
					type: 'collection',
					isEditing: false,
				},
			};
			treeData.push(collectionNode);

			// Process collection items
			if (item.items?.length) {
				treeData.push(
					...parseTreeData(
						item.items as (Folder | Endpoint)[],
						item.uuid,
					),
				);
			}
		} else {
			// Handle folders and endpoints
			const typedItem = item as Folder | Endpoint;
			const node = {
				id: typedItem.uuid,
				parent: parentId,
				droppable: typedItem.type === 'folder',
				text:
					typedItem.type === 'endpoint'
						? (typedItem.name ??
							(typedItem as Endpoint).url)
						: typedItem.name,
				data: {
					type: typedItem.type,
					isEditing: false,
					...(typedItem.type === 'endpoint' && {
						method: (typedItem as Endpoint).method,
						url: (typedItem as Endpoint).url,
					}),
				},
			};
			treeData.push(node);

			// Process folder items
			if (typedItem.type === 'folder') {
				const folder = typedItem as Folder;
				if (folder.items?.length) {
					treeData.push(
						...parseTreeData(
							folder.items as (Folder | Endpoint)[],
							folder.uuid,
						),
					);
				}
			}
		}
	});

	return treeData;
};

interface CollectionListProps {
	collections: Collection[];
	loading: boolean;
	error: string | null;
	onCreateCollection: () => void;
	onEndpointClick?: (endpoint: Endpoint) => void;
}

export function CollectionList({
	collections,
	loading,
	error,
	onCreateCollection,
	onEndpointClick,
}: CollectionListProps) {
	const dispatch = useAppDispatch();
	const [treeData, setTreeData] = useState<
		NodeModel<any>[]
	>(() => parseTreeData(collections));

	useEffect(() => {
		setTreeData(parseTreeData(collections));
	}, [collections]);

	const openIds = useAppSelector(
		(state) => state.collections.openIds,
	);

	useEffect(() => {
		// Load initial open state
		dispatch(loadOpenIds());
	}, [dispatch]);

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
		setTreeData(newTree as any);

		dispatch(
			reorder({
				draggedUuid: options.dragSource?.id as string,
				oldParentUuid: options.dragSource?.parent as string,
				newParentUuid: options.dropTarget?.id as string,
				relativeIndex: options.relativeIndex as number,
			}),
		);

		const draggedItem = newTree.find(
			(item) => item.id === options.dragSource?.id,
		);
		if (!draggedItem) return;
	};

	const handleChangeOpen = (
		newOpenIds: NodeModel['id'][],
	) => {
		const stringIds = newOpenIds.map((id) => String(id)); // Convert all IDs to strings
		dispatch(setOpenIds(stringIds));
	};

	const handleCreateItem = async (
		name: string,
		type: 'folder' | 'endpoint',
		parentUuid: string,
	) => {
		try {
			const result = await dispatch(
				createItem({
					name,
					type,
					parentUuid,
					...(type === 'endpoint' && {
						method: 'GET',
						url: '',
					}),
				}),
			).unwrap();

			// Update openIds if needed
			if (
				result.item.parent_uuid &&
				!openIds.includes(result.item.parent_uuid)
			) {
				const newOpenIds = [
					...openIds,
					result.item.parent_uuid,
				];
				await dispatch(setOpenIds(newOpenIds)).unwrap();
			}

			// Refresh collections to get the new item
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
			onCreateCollection={onCreateCollection}
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
