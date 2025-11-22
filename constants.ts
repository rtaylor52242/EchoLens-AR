import { Memory } from './types';

export const MOCK_MEMORIES: Memory[] = [
  {
    id: '1',
    url: 'https://picsum.photos/id/1015/800/600',
    thumbnail: 'https://picsum.photos/id/1015/200/200',
    timestamp: '2015-06-15T14:30:00Z',
    location: { lat: 37.7749, lng: -122.4194, placeName: 'River Valley' },
    description: 'Summer vacation, 2015. The water was higher then.',
  },
  {
    id: '2',
    url: 'https://picsum.photos/id/1036/800/1200',
    thumbnail: 'https://picsum.photos/id/1036/200/200',
    timestamp: '1998-11-22T09:15:00Z',
    location: { lat: 40.7128, lng: -74.0060, placeName: 'Old Lodge' },
    description: 'Grandpa\'s cabin before the renovation.',
  },
  {
    id: '3',
    url: 'https://picsum.photos/id/1040/800/600',
    thumbnail: 'https://picsum.photos/id/1040/200/200',
    timestamp: '2020-03-01T18:45:00Z',
    location: { lat: 34.0522, lng: -118.2437, placeName: 'City Castle' },
    description: 'Empty streets during the lockdown.',
  },
];

export const THEME = {
  primary: 'cyan-400',
  secondary: 'slate-900',
  accent: 'teal-500',
  warning: 'rose-500',
};
