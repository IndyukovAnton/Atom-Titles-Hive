# Profile Statistics API Documentation

## Overview
This document describes the Profile Statistics API endpoints that provide comprehensive user statistics for the Atom Titles-Hive application.

## Endpoints

### GET /api/profile/stats

Returns comprehensive statistics for the authenticated user.

#### Authentication
Requires JWT Bearer token in the Authorization header.

#### Request
```http
GET /api/profile/stats
Authorization: Bearer <jwt_token>
```

#### Response

**Success (200 OK)**

```json
{
  "totalEntries": 42,
  "favoriteCategory": "Сериал",
  "favoriteGenre": "Драма",
  "totalWatchTime": 156.5,
  "currentMonthWatchTime": 24.3
}
```

**Error (401 Unauthorized)**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Error (404 Not Found)**
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalEntries` | number | Total number of media entries added by the user |
| `favoriteCategory` | string \| null | Most frequently used category (e.g., "Фильм", "Сериал", "Аниме"). Returns `null` if no entries exist. |
| `favoriteGenre` | string \| null | Most frequently occurring genre across all entries. Returns `null` if no genres are recorded. |
| `totalWatchTime` | number | Total watch time in hours (calculated from `startDate` to `endDate` of all entries). Rounded to 1 decimal place. |
| `currentMonthWatchTime` | number | Watch time for the current month in hours. Only includes entries where `endDate` falls within the current month. Rounded to 1 decimal place. |

## Business Logic

### Total Entries
Counts all media entries associated with the user, regardless of their status or dates.

### Favorite Category
- Groups all entries by their `category` field
- Counts occurrences of each category
- Returns the category with the highest count
- In case of a tie, returns any one of the tied categories
- Returns `null` if user has no entries

### Favorite Genre
- Parses `genres` field from all entries (stored as JSON array)
- Counts occurrences of each unique genre across all entries
- Returns the genre with the highest count
- Handles parsing errors gracefully (logs warning and continues)
- Returns `null` if no valid genres are found

### Total Watch Time
- For each entry with both `startDate` and `endDate`:
  - Calculates the difference in milliseconds
  - Converts to hours
  - Adds to the running total
- Entries without dates are skipped
- Negative time differences are ignored
- Result is rounded to 1 decimal place

### Current Month Watch Time
- Determines the current month's start and end dates
- Filters entries where `endDate` falls within the current month
- Calculates watch time the same way as total watch time
- Result is rounded to 1 decimal place

## Performance Considerations

- All statistics are calculated on-demand (no caching)
- Uses a single database query to fetch all user entries
- Expected response time: < 500ms for users with up to 100 entries
- For users with 1000+ entries, response time should still be < 1s

## Edge Cases

### No Entries
```json
{
  "totalEntries": 0,
  "favoriteCategory": null,
  "favoriteGenre": null,
  "totalWatchTime": 0,
  "currentMonthWatchTime": 0
}
```

### Entries Without Dates
Entries without `startDate` or `endDate` are:
- Counted in `totalEntries`
- Included in category/genre analysis
- Excluded from watch time calculations

### Invalid Genre Data
If the `genres` field contains invalid JSON or non-array data:
- The entry is skipped for genre statistics
- A warning is logged
- Processing continues for other entries

### Equal Category/Genre Counts
When multiple categories or genres have the same count:
- Any one of the tied values will be returned
- The selection is deterministic but should not be relied upon

## Example Usage

### Fetch Statistics
```javascript
const response = await fetch('http://localhost:3000/api/profile/stats', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const stats = await response.json();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Favorite category: ${stats.favoriteCategory}`);
console.log(`Total watch time: ${stats.totalWatchTime} hours`);
```

## Related Endpoints

- `GET /api/profile` - Get basic user profile information
- `PATCH /api/profile` - Update user profile

## Changelog

### Version 1.0.0 (2026-01-13)
- Initial implementation of statistics API
- Returns total entries, favorite category/genre, and watch time metrics
- Watch time calculated in hours (not days)
- Proper error handling for edge cases
