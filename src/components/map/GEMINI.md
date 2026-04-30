# Map & Travel Plans Standard

## 1. Travel Plans Data Structure
- `trips`: Main travel unit (title, start/end dates).
- `trip_plans`: Daily items (category, time, memo, location/coords).

## 2. Implementation Notes
- **Notification**: Triggered on `trips` table changes.
- **Time Selection**: 5-minute increments via `TimePicker`.
