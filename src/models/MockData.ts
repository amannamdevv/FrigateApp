export interface Detection {
  id: string;
  camera: string;
  label: string;
  timestamp: number;
  imageUrl: string;
  timeAgo: string;
  isReviewed: boolean;
}

export const MOCK_DETECTIONS: Detection[] = [
  {
    id: '1',
    camera: 'Sundar_Nagar',
    label: 'Person',
    timestamp: Date.now() - 1000 * 60 * 5, // 5 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1517732306149-e8f829eb588a?q=80&w=600&auto=format&fit=crop', // Placeholder for people
    timeAgo: '5m ago',
    isReviewed: false,
  },
  {
    id: '2',
    camera: 'MP_Nagar',
    label: 'Car',
    timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600&auto=format&fit=crop', // Placeholder for car
    timeAgo: '15m ago',
    isReviewed: true,
  },
  {
    id: '3',
    camera: 'TRC',
    label: 'Person',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1506869640319-fea1a2ab8e9c?q=80&w=600&auto=format&fit=crop', // Placeholder for street person
    timeAgo: '30m ago',
    isReviewed: false,
  },
  {
    id: '4',
    camera: 'Test_Cam',
    label: 'Dog',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop', // Placeholder for dog
    timeAgo: '45m ago',
    isReviewed: false,
  },
  {
    id: '5',
    camera: 'BPR01',
    label: 'Person',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    imageUrl: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?q=80&w=600&auto=format&fit=crop', // Placeholder for meeting room
    timeAgo: '1h ago',
    isReviewed: true,
  },
  {
    id: '6',
    camera: 'DVR_CAM2',
    label: 'Car',
    timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600&auto=format&fit=crop', // Placeholder for car
    timeAgo: '2h ago',
    isReviewed: false,
  },
];
