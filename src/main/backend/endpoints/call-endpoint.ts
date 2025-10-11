import { ipcChannels } from "../../../config/ipc-channels";
import { BackendClient, EndpointConfig } from "../backend-client";

export function getCallEndpointApis(
	client: BackendClient,
): EndpointConfig[] {
	return [
		{
			ipcChannel: ipcChannels.BACKEND_API_CALL_ENDPOINT,
			handler: async (_event, requestData: any) => {
				const response = await client.request(
					'/api/call-endpoint/call',
					{
						method: 'POST',
						body: JSON.stringify(requestData),
					},
				);
				return await client.processResponse(response);
			},
		},
	];
}
