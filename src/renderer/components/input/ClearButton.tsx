import { cn } from '@/lib/utils';
import { ResetIcon } from '@radix-ui/react-icons';
import React from 'react';

export function ClearButton({
	onClick,
	className,
	...props
}: {
	onClick: () => void;
	className?: string;
	style?: React.CSSProperties;
	props?: any;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'absolute bottom-0 right-0 top-0 z-10 grid place-content-center px-4 py-2 text-primary hover:text-muted-foreground',
				className,
			)}
			{...props}
		>
			<ResetIcon className="h-4 w-4" />
			<span className="sr-only">Clear value...</span>
		</button>
	);
}
