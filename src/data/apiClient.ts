// Mock data for the API Client

export interface DataRow {
  id: number;
  keyValue: string;
  value: string;
  enabled: boolean;
}

export const defaultParams: DataRow[] = [
  {
    id: 1,
    keyValue: 'param1',
    value: 'value1',
    enabled: true,
  },
];

export const defaultHeaders: DataRow[] = [
  {
    id: 1,
    keyValue: 'Content-Type',
    value: 'application/json',
    enabled: true,
  },
];

export const defaultUrl = 'https://jsonplaceholder.typicode.com/posts/1';

export const defaultBody = JSON.stringify(
  {
    title: 'My New Post',
    body: 'This is the content of my new post.',
    userId: 1,
  },
);

export const HTTP_METHODS = [
	'GET',
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
	'HEAD',
	'OPTIONS',
];
