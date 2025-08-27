"use client" // This directive marks the file as a Client Component.

import { create } from "zustand" // Import the 'create' function from Zustand.

// Define the shape of our sidebar state.
interface SidebarState {
  isOpen: boolean // Boolean to indicate if the sidebar is open or closed.
  toggle: () => void // Function to toggle the 'isOpen' state.
}

// Create the Zustand store for sidebar state.
export const useSidebarState = create<SidebarState>((set) => ({
  isOpen: true, // Initialize 'isOpen' to true, meaning the sidebar is open by default on desktop.
  toggle: () => set((state) => ({ isOpen: !state.isOpen })), // The toggle function inverts the current 'isOpen' state.
}))
