import { FacilityType } from '../core/models';

export const FACILITY_TYPES: {
  value: FacilityType;
  label: string;
  plural: string;
  icon: string;
}[] = [
  { value: 'Room', label: 'Room', plural: 'Rooms', icon: 'lucideDoorOpen' },
  { value: 'Lab', label: 'Lab', plural: 'Labs', icon: 'lucideMonitor' },
  { value: 'Equipment', label: 'Equipment', plural: 'Equipment', icon: 'lucideProjector' },
];

export const facilityIcon = (type: FacilityType) =>
  FACILITY_TYPES.find((t) => t.value === type)?.icon ?? 'lucideDoorOpen';

/** Capacity means seats for rooms and labs, and units for equipment */
export const capacityLabel = (type: FacilityType, capacity: number) =>
  type === 'Equipment'
    ? `${capacity} ${capacity === 1 ? 'unit' : 'units'}`
    : `${capacity} ${capacity === 1 ? 'seat' : 'seats'}`;
