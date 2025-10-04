import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGlobalContext } from '@/renderer/context/global-context';
import '@/renderer/styles/globals.scss';

// Component to display a single setting
function SettingItem({
	name,
	value,
}: {
	name: string;
	value: any;
}) {
	return (
		<div className="flex items-center justify-between border-b py-3 last:border-b-0">
			<span className="font-medium">{name}</span>
			<Badge
				variant={
					typeof value === 'boolean'
						? value
							? 'success'
							: 'destructive'
						: 'default'
				}
			>
				{value.toString()}
			</Badge>
		</div>
	);
}

function ChildApp() {
	const { settings } = useGlobalContext();

	return (
		<div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-6 text-foreground">
			<Card className="mx-auto w-full max-w-2xl shadow-lg">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">
						Application Settings
					</CardTitle>
					<CardDescription>
						View and manage your application settings. These
						settings affect various aspects of the
						application's behavior and appearance.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ScrollArea className="h-[60vh] pr-4">
						<div className="space-y-2">
							{Object.entries(settings).map(
								([key, value]) => (
									<SettingItem
										key={key}
										name={key}
										value={value}
									/>
								),
							)}
						</div>
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}

export default ChildApp;
