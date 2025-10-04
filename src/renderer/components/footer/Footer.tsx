import React from 'react';

// We can't use the ScrollArea here or the scroll will persist between navigations
export function Footer({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="z-10 flex h-6 w-full shrink-0 select-none items-center justify-between border-t bg-background px-2 py-1 text-[11px] text-muted-foreground">
			{children}
		</div>
	);
}
