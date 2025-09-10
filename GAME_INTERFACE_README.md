# Game Interface Documentation

## Tổng quan

Hệ thống game interface mới được thiết kế với mobile-first approach, cung cấp trải nghiệm người dùng tối ưu trên thiết bị di động với bottom navigation và floating chat.

## Cấu trúc Components

### GameLayout
Component chính chứa layout của game với:
- Header hiển thị thông tin user và vàng
- Bottom navigation với 5 tab chính
- Floating chat bubble
- Expandable chat panel

### GameDashboard
Component quản lý state của các tab và điều phối navigation giữa các tab.

### Tab Components

#### 1. StatusTab (Trạng thái)
- Hiển thị thông tin nhân vật: level, HP, MP, EXP
- Progress bars cho HP/MP/EXP
- Grid hiển thị các chỉ số cơ bản
- Thông tin về guild và vàng

#### 2. InventoryTab (Kho đồ)
- Tabs để lọc items theo loại (Tất cả, Vũ khí, Giáp, Vật phẩm)
- Grid hiển thị items với rarity colors
- Modal chi tiết item với thông tin và actions
- Buttons để equip/unequip items

#### 3. ExploreTab (Khám phá)
- Danh sách dungeons với độ khó và phần thưởng
- PvP matchmaking với stats của đối thủ
- Buttons để join dungeon hoặc tìm trận PvP
- Hiển thị rewards và requirements

#### 4. QuestTab (Nhiệm vụ)
- Hệ thống nhiệm vụ với các loại: Chính, Phụ, Hàng ngày, Thành tựu
- Progress tracking cho từng nhiệm vụ
- Hiển thị phần thưởng và yêu cầu
- Buttons để nhận, hoàn thành và nhận thưởng nhiệm vụ
- Tabs để lọc nhiệm vụ theo loại

#### 5. GuildTab (Công hội)
- Thông tin guild: tên, level, số thành viên
- Tabs cho Members, Events, Chat
- Danh sách thành viên với roles và status
- Guild events với join buttons
- Guild chat với message history

## Cách sử dụng

### 1. Navigation
- Sử dụng bottom navigation để chuyển đổi giữa 5 tabs
- Mỗi tab có icon và label rõ ràng
- Active tab được highlight với màu sắc

### 2. Chat System
- Floating chat bubble ở góc phải dưới
- Click để mở/đóng chat panel
- Badge hiển thị số tin nhắn chưa đọc
- Chat input để gửi tin nhắn

### 3. Responsive Design
- **Mobile (< 1024px)**: Bottom navigation, centered content (max-w-md)
- **Desktop (≥ 1024px)**: Fixed sidebar navigation (256px), full-width content (max-w-4xl)
- **Fixed Sidebar**: Sidebar có height cố định với scroll riêng, không kéo dài theo nội dung
- **Adaptive Layout**: Different headers và navigation cho mobile vs desktop
- **Chat System**: Floating chat bubble hoạt động trên cả mobile và desktop
- Touch-friendly buttons và interactions
- Adaptive text sizes và spacing

## Technical Details

### Dependencies
- Next.js 15 với TypeScript
- Tailwind CSS cho styling
- shadcn/ui components
- Lucide React icons
- React hooks cho state management

### File Structure
```
frontend/src/components/game/
├── GameLayout.tsx          # Main layout component
├── GameDashboard.tsx       # Tab management component
└── tabs/
    ├── StatusTab.tsx       # Character status
    ├── InventoryTab.tsx    # Item management
    ├── ExploreTab.tsx      # Dungeons & PvP
    ├── QuestTab.tsx        # Quest system
    └── GuildTab.tsx        # Guild management
```

### State Management
- Local state với useState cho từng component
- Props drilling từ GameDashboard xuống các tab
- AuthProvider integration cho user data

### Styling
- **Mobile-First**: Responsive design với breakpoints
- **Desktop Layout**: Fixed sidebar navigation với full-width content
- **Fixed Sidebar**: Height cố định với overflow scroll riêng
- **Adaptive Components**: Different layouts cho mobile vs desktop
- Consistent color scheme với Tailwind
- Custom progress bars với Tailwind utilities
- Card-based layout cho content sections

## Future Enhancements

### API Integration
- Kết nối với backend APIs cho real data
- Real-time updates với WebSocket
- Error handling và loading states

### Additional Features
- Push notifications cho chat và events
- Offline support với service workers
- Advanced filtering và search
- Social features mở rộng

### Performance Optimizations
- Lazy loading cho tab components
- Image optimization cho item icons
- Virtual scrolling cho large lists
- Bundle splitting cho better loading

## Development Notes

### Mock Data
Hiện tại sử dụng mock data cho development. Cần thay thế bằng real API calls khi backend sẵn sàng.

### TypeScript Interfaces
Đã định nghĩa interfaces cho tất cả data structures. Cần update khi API schema thay đổi.

### Testing
Cần thêm unit tests và integration tests cho tất cả components.

### Accessibility
Cần thêm ARIA labels và keyboard navigation support.
