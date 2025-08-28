# Claude Code Instructions

## Project Overview
This is a note-taking app built with Next.js, shadcn/ui, and Supabase. The project follows a phased development approach with local caching for prototyping before backend integration.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), shadcn/ui, Tailwind CSS
- **State Management**: Zustand
- **Rich Text Editor**: Tiptap
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel (Frontend), Supabase (Backend)
- **Package Manager**: npm (no Vite)

## Development Phases
1. ✅ Spec creation
2. ✅ MVP scoping  
3. ✅ Development plan & architecture
4. 🔄 Local prototype with caching
5. ⏳ Backend integration
6. ⏳ Vercel deployment
7. ⏳ Supabase deployment

## Key Commands
```bash
# Development
npm run dev

# Build & Test
npm run build
npm run lint
npm run typecheck
```

## Architecture Notes
- Use localStorage for caching during prototype phase
- Implement auto-save with 2-second debounce
- Folder/tag organization system
- Full-text search with Fuse.js
- Responsive design with dark/light mode

## Current Status
✅ Fully refined prototype with all functionality completed!

**What's working:**
- Next.js app setup with shadcn/ui components
- Zustand stores for notes, folders, tags, and UI state management  
- Local storage caching with auto-save (2-second debounce)
- Rich text editor with Tiptap (fully functional toolbar)
- Responsive layout with sidebar and header
- Complete routing structure (/, /notes, /notes/[id], /settings)
- Note CRUD operations (Create, Read, Update, Delete, Pin)
- Folder creation and management with note counts
- Tag creation and management with color coding
- Search functionality with Fuse.js across title and content
- Sample data initialization
- Dark/light theme toggle with persistence
- Settings page with data export/import/clear
- Keyboard shortcuts (Ctrl+N for new note)
- Proper navigation between pages
- Compact note list design
- Note pinning functionality
- Dropdown menu with note actions (pin, delete)
- HTML content stripping in note previews
- Folder and tag filtering in sidebar

**Running on:** http://localhost:3001

**Latest refinements completed:**
- ✅ **Fixed scrolling**: Added proper height constraints to ScrollArea components
- ✅ **Ultra-compact note cards**: Reduced padding to p-2, smaller text (text-sm/text-xs)
- ✅ **Auto-color tags**: 10-color palette auto-assigned to new tags
- ✅ **Fixed auto-save reordering**: Added initialization flag to prevent timestamp updates on note selection
- ✅ **Cleaned up pin functionality**: Removed redundant pin button from dropdown
- ✅ **Note metadata panel**: Added folder/tag assignment UI in note detail pane
- ✅ **Enhanced rich text editor**: Improved toolbar, better prose styling, proper disabled states

**Previous refinements:**
- ✅ Sidebar now shows actual folders/tags lists with creation UI
- ✅ Complete routing structure with navigation
- ✅ Note CRUD operations with pinning
- ✅ Folder/tag creation, filtering, and management
- ✅ Search functionality with Fuse.js
- ✅ Dark/light theme with persistence
- ✅ Settings page with data management

**Next steps:** Ready for backend integration phase with Supabase.