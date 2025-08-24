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

export const sampleEndpoints = [
  {
    id: 1,
    name: 'Get All Posts',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts',
    description: 'Fetch all blog posts',
    headers: [
      { id: 1, keyValue: 'Accept', value: 'application/json', enabled: true },
    ],
  },
  {
    id: 2,
    name: 'Create New Post',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    description: 'Create a new blog post',
    headers: [
      {
        id: 1,
        keyValue: 'Content-Type',
        value: 'application/json',
        enabled: true,
      },
      { id: 2, keyValue: 'Accept', value: 'application/json', enabled: true },
    ],
    body: JSON.stringify(
      {
        title: 'My New Post',
        body: 'This is the content of my new post.',
        userId: 1,
      },
      null,
      2,
    ),
  },
  {
    id: 3,
    name: 'Get User by ID',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    description: 'Fetch specific user details',
    headers: [
      { id: 1, keyValue: 'Accept', value: 'application/json', enabled: true },
    ],
  },
];

export const HTTP_METHODS = [
	'GET',
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
	'HEAD',
	'OPTIONS',
];
