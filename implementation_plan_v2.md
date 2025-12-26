# Implementation Plan - Advanced Features & Fixes

## Goal
Implement missing pages (Profile, Settings), fix reported issues (Theme, Modal), and enhance Groups functionality with Drag & Drop and Context Menus.

## 1. Theme Fix
- **Issue**: Theme switching is reported as incorrect.
- **Diagnosis**: Need to ensure `useThemeStore` correctly applies the `dark-theme` or `light-theme` class to `document.body` or `html` on mount and change.
- **Plan**: Add a `useEffect` subscription or update logic in `App.tsx` or `createThemeStore`.

## 2. Profile Page & Statistics
- **Features**:
  - User info display (Avatar, Name, Email).
  - **Statistics Dashboard**:
    - Total items watched/read.
    - Breakdown by Category (Pie chart).
    - Average Rating.
    - "Days since start" (account age).
- **Backend**: Update `users` or `media` service to provide aggregations.

## 3. Groups Enhancements
- **Context Menu**:
  - Right-click on Group -> [Edit, Delete].
- **Editing**:
  - Rename Group modal or inline edit.
- **Deleting**:
  - Confirmation dialog.
- **Drag & Drop**:
  - **Reordering Groups**: Allow user to reorder the group list.
  - **Dependency**: `dnd-kit` or `@hello-pangea/dnd`.

## 4. Settings Page
- **Features**:
  - Active Session management (Logout).
  - Password change form.
  - Theme preference.

## 5. Add Media Modal Improvements
- **Request**: "Fix add media modal".
- **Plan**:
  - Ensure validation and error states are clear.
  - Check Group select UX.

## Execution Order
1. **Fix Theme** (Quickest/Critical).
2. **Groups Enhancements** (Complex UI).
3. **Profile & Stats** (New Page).
4. **Settings Page** (New Page).
