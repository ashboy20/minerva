import { ipcChannels } from '../../../config/ipc-channels';
import {
	BackendClient,
	EndpointConfig,
} from '../backend-client';

export function getEndpointDetailApis(
	client: BackendClient,
): EndpointConfig[] {
	return [
		{
			ipcChannel: ipcChannels.BACKEND_ENDPOINT_GET_DETAIL,
			handler: async (_event, uuid: string) => {
				const response = await client.request(
					`/api/collections/endpoint/${uuid}`,
					{
						method: 'GET',
					},
				);
				return await client.processResponse(response);
			},
		},
	];
}
