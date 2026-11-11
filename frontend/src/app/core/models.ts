// Mirrors the DTOs exposed by the gateway (see SRS sections 5 and 6).
export type FacilityType = 'Room' | 'Lab' | 'Equipment';
export type FacilityStatus = 'Available' | 'Maintenance';

export interface Facility {
  id: number;
  title: string;
  building: string;
  location: string;
  capacity: number;
  type: FacilityType;
  status: FacilityStatus;
}

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  category: string;
  building: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: 'Scheduled' | 'Changed' | 'Cancelled';
}
