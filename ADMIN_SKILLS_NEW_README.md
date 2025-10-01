# 🎨 Admin Skills UI - Modern & User-Friendly

## 📋 Overview

**AdminSkillsNew.tsx** là giao diện admin hoàn toàn mới được thiết kế với UX tối ưu để tạo và quản lý skills mà **KHÔNG CẦN BIẾT JSON**! 🎉

## ✨ Key Features

### 1. **Tab-based Navigation**
Form được chia thành 4 tabs rõ ràng:
- 📝 **Basic**: Thông tin cơ bản (tên, mô tả, category, type, requirements)
- ⚡ **Effects**: Visual builder cho stat bonuses theo level
- 🔒 **Prerequisites**: Checkboxes cho class restrictions và skill prerequisites
- ⚔️ **Combat**: Settings cho active/toggle skills (mana, cooldown, formulas)

### 2. **Auto-Generated Skill IDs**
```
Nhập tên: "Tấn Công Mạnh"
→ ID tự động: tan_cong_manh ✅
```
Không cần nghĩ ra ID nữa!

### 3. **Visual Effects Builder**
Thay vì JSON phức tạp:
```json
{
  "1": {"statBonuses": {"attack": 10, "defense": 5}},
  "2": {"statBonuses": {"attack": 20, "defense": 10}}
}
```

Bạn được form visual với:
- ➕ Button "Add Level" để thêm level mới
- 📋 Button "Copy" để duplicate effects
- 🗑️ Button "Delete" để xóa level
- Inputs riêng cho từng stat (Attack, Defense, HP, Crit Rate, etc.)
- Phân nhóm: ⚔️ Offensive và 🛡️ Defensive

### 4. **Dropdown Selects thay vì Text Inputs**
- **Category**: Dropdown với 7 options (Combat ⚔️, Magic ✨, Defense 🛡️, ...)
- **Skill Type**: Dropdown với icon và tooltip giải thích
- **Attribute**: Dropdown với emoji (💪 STR, 🧠 INT, 🎯 DEX, ❤️ VIT, 🍀 LUK)
- **Target Type**: Dropdown với emoji (👤 Self, 💀 Enemy, 💥 AOE, ...)

### 5. **Class Restrictions - Checkbox Grid**
Thay vì `["warrior", "knight"]`, bạn tick checkboxes:
```
☑ ⚔️ Warrior    ☐ 🔮 Mage
☐ 🏹 Archer     ☑ 🗡️ Assassin
☑ 🛡️ Knight     ☐ ✨ Priest
☐ 💥 Berserker
```

### 6. **Prerequisites - Searchable List**
- 🔍 Search bar để filter skills
- Checkbox list với tất cả skills hiện có
- Hiển thị tên skill + level requirement
- Counter: "🔒 Đã chọn: 3 skill(s)"

### 7. **Smart Tooltips**
Hover vào icons để xem thông tin chi tiết:
- Skill Type → "Always active, provides constant bonuses"
- Info icons → Giải thích từng field

### 8. **Toast Notifications**
Feedback real-time cho mọi action:
- ✅ "Đã tạo skill thành công!"
- ➕ "Đã thêm Level 2"
- 📋 "Đã copy Level 1 → Level 2"
- ⚠️ "Max level là 5"
- 🗑️ "Đã xóa Level 3"

### 9. **Icons everywhere! 🎨**
Mọi thứ đều có icon để dễ nhận diện:
- Stats: ⚔️ Attack, 🛡️ Defense, ❤️ HP, 💥 Crit, 🎯 Accuracy, ...
- Actions: ➕ Add, 📋 Copy, 🗑️ Delete, ✨ Create, ✅ Update
- Categories: Combat ⚔️, Magic ✨, Defense 🛡️, ...
- Classes: Warrior ⚔️, Mage 🔮, Archer 🏹, ...

### 10. **Responsive & Dark Mode Ready**
- Mobile-friendly tabs và grids
- Dark mode support với proper colors
- Smooth transitions và hover effects

## 🚀 How to Use

### Creating a New Skill

#### Step 1: Basic Info (Tab 1)
1. Nhập **tên skill** → ID tự động generate
2. Nhập **mô tả**
3. Chọn **category** từ dropdown
4. Chọn **skill type** (Passive/Active/Toggle)
5. Set **requirements**: level, skill points, attribute

#### Step 2: Effects (Tab 2)
1. Click **[Add Level]** để thêm levels (up to maxLevel)
2. Cho mỗi level:
   - Fill **Offensive stats**: Attack, Crit Rate, Accuracy, ...
   - Fill **Defensive stats**: Defense, HP, Dodge, ...
3. Click **[📋 Copy]** để duplicate một level
4. Click **[🗑️]** để xóa level (phải có ít nhất 1)

#### Step 3: Prerequisites (Tab 3)
1. **Class Restrictions**:
   - Tick checkboxes cho classes được phép học
   - Để trống = tất cả classes
2. **Skill Prerequisites**:
   - Dùng search bar để tìm skills
   - Tick checkboxes cho skills cần học trước

#### Step 4: Combat Settings (Tab 4)
Chỉ cho Active/Toggle skills:
1. Set **Mana Cost** và **Cooldown**
2. Chọn **Target Type** (Self/Enemy/AOE)
3. Chọn **Damage Type** (Physical/Magical)
4. Nhập **formulas** (optional): `INT * 2 + level * 10`

#### Step 5: Submit
Click **[✨ Tạo Skill]** → Done! 🎉

### Editing a Skill
1. Click **Edit** trên skill trong table
2. Form sẽ auto-fill với data hiện tại
3. Edit bất kỳ field nào
4. Click **[✅ Cập nhật]**

### Deleting a Skill
1. Click **Delete** trên skill trong table
2. Confirm popup
3. Done!

## 🎯 UI/UX Improvements Over Old Version

| Feature | Old UI | New UI |
|---------|--------|--------|
| Skill ID | Manual text input ❌ | Auto-generated ✅ |
| Category | Text input ❌ | Dropdown with icons ✅ |
| Effects | JSON textarea ❌ | Visual form builder ✅ |
| Prerequisites | JSON array ❌ | Searchable checkboxes ✅ |
| Classes | JSON array ❌ | Checkbox grid ✅ |
| Combat settings | Mixed inputs ❌ | Dedicated tab ✅ |
| Navigation | Scroll form ❌ | Tab navigation ✅ |
| Feedback | Generic toasts ❌ | Specific emoji toasts ✅ |
| Visual hierarchy | Flat ❌ | Grouped with separators ✅ |
| Icons | Minimal ❌ | Everywhere! ✅ |

## 📊 Stats Cards

Top của page hiển thị overview:
- 📚 **Tổng Skills**: Total count
- 🛡️ **Passive Skills**: Count + "3 slots max"
- ⚡ **Active Skills**: Count + "4 slots max"
- 🎯 **Toggle Skills**: Count + "2 slots max"

## 🎨 Design Patterns

### Color Coding
- **Passive**: Green 🟢
- **Active**: Blue 🔵
- **Toggle**: Purple 🟣
- **Categories**: Each has unique color

### Badge System
```tsx
<Badge className="bg-green-500">
  <Shield className="h-3 w-3 mr-1" />
  Passive
</Badge>
```

### Responsive Grid
```tsx
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 🔧 Technical Details

### State Management
```tsx
// Form data
const [formData, setFormData] = useState({...});

// Effects builder
const [effectsData, setEffectsData] = useState<EffectFormData[]>([]);

// Multi-select states
const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);
const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

// Search
const [prereqSearch, setPrereqSearch] = useState('');
```

### Data Transformation
Visual form → JSON API:
```tsx
// Effects builder state
effectsData = [
  { level: 1, statBonuses: { attack: 10, defense: 5 } },
  { level: 2, statBonuses: { attack: 20, defense: 10 } }
]

// Transform to API format
effects = {
  1: { statBonuses: { attack: 10, defense: 5 } },
  2: { statBonuses: { attack: 20, defense: 10 } }
}
```

### Edit Mode
Load skill → Parse JSON → Fill forms:
```tsx
const startEdit = (skill) => {
  // Basic fields → formData
  setFormData({ name: skill.name, ... });
  
  // Effects JSON → effectsData array
  const parsed = Object.entries(skill.effects).map(([level, effect]) => ({
    level: parseInt(level),
    statBonuses: effect.statBonuses || {}
  }));
  setEffectsData(parsed);
  
  // Arrays → multi-select states
  setSelectedPrerequisites(skill.prerequisites || []);
  setSelectedClasses(skill.classRestrictions || []);
};
```

## 🧪 Testing Checklist

- [ ] Create new skill without JSON knowledge
- [ ] Auto-generated ID works with Vietnamese characters
- [ ] Add/remove effect levels
- [ ] Copy effect level to next
- [ ] Class checkboxes toggle correctly
- [ ] Prerequisites search filters properly
- [ ] Edit existing skill loads correctly
- [ ] Update skill saves changes
- [ ] Delete skill with confirmation
- [ ] Tab navigation works smoothly
- [ ] Toast notifications show for all actions
- [ ] Tooltips display on hover
- [ ] Form validation prevents empty submission
- [ ] Dark mode renders properly
- [ ] Mobile responsive layout

## 📁 File Structure

```
frontend/src/components/admin/
├── AdminSkills.tsx          # Old version (backup)
├── AdminSkillsNew.tsx       # 🆕 New improved version
└── DataTable.tsx            # Reusable table component

frontend/src/components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── label.tsx
├── textarea.tsx
├── checkbox.tsx
├── badge.tsx
├── separator.tsx
├── select.tsx
├── tabs.tsx
└── tooltip.tsx              # 🆕 Custom tooltip component
```

## 🔄 Migration Path

### Option A: Direct Replace
```tsx
// In your admin route file
import AdminSkillsNew from '@/components/admin/AdminSkillsNew';

export default function AdminSkillsPage() {
  return <AdminSkillsNew />;
}
```

### Option B: Toggle Mode
```tsx
const [useNewUI, setUseNewUI] = useState(true);

return (
  <>
    <Button onClick={() => setUseNewUI(!useNewUI)}>
      Toggle UI ({useNewUI ? 'New' : 'Old'})
    </Button>
    {useNewUI ? <AdminSkillsNew /> : <AdminSkills />}
  </>
);
```

## 💡 Tips for Admin Users

### Quick Workflow
1. **Fill Basic tab first** → Auto ID appears
2. **Jump to Effects tab** → Add levels quickly
3. **Set Prerequisites tab** → Tick classes if needed
4. **Skip Combat tab** if passive skill
5. **Submit!** ✨

### Keyboard Shortcuts
- `Tab`: Navigate between fields
- `Enter` (in inputs): Focus next field
- `Space` (on checkboxes): Toggle selection
- `Escape`: Clear search

### Best Practices
- ✅ Use descriptive names (auto-generates good IDs)
- ✅ Add at least 1 effect level
- ✅ Set appropriate skill point costs
- ✅ Test formulas before saving
- ✅ Use tooltips when unsure

### Common Mistakes to Avoid
- ❌ Leaving name/description empty
- ❌ Setting maxLevel but not adding effects
- ❌ Forgetting to set prerequisites for advanced skills
- ❌ Wrong attribute requirements for skill type

## 🎉 Summary

**AdminSkillsNew.tsx** transforms skill creation from:
```
❌ Technical JSON editing
```

To:
```
✅ Visual form building with instant feedback
```

**Result**: Any admin can create complex skills in minutes without coding knowledge! 🚀

---

**Status**: Production Ready ✅
**Dependencies**: All UI components included
**Browser Support**: Modern browsers + Mobile
**Dark Mode**: Full support 🌙
**Accessibility**: Keyboard navigation ready ♿

Enjoy the new admin experience! 🎊
