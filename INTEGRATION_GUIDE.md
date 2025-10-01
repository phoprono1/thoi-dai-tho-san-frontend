# 🚀 Quick Start Guide - AdminSkillsNew

## 📦 Installation (Already Done!)

All files have been created:
```
✅ frontend/src/components/admin/AdminSkillsNew.tsx
✅ frontend/src/components/ui/tooltip.tsx
✅ frontend/ADMIN_SKILLS_NEW_README.md
```

## 🔧 Integration Steps

### Step 1: Check if Badge component exists

Check if file exists: `frontend/src/components/ui/badge.tsx`

If NOT exists, create it:

```tsx
// frontend/src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

### Step 2: Check if Separator component exists

Check if file exists: `frontend/src/components/ui/separator.tsx`

If NOT exists, create it:

```tsx
// frontend/src/components/ui/separator.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
```

### Step 3: Update your Admin Route

**Option A: Replace old component**

```tsx
// frontend/src/app/admin/skills/page.tsx (or your route file)
import AdminSkillsNew from '@/components/admin/AdminSkillsNew';

export default function AdminSkillsPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminSkillsNew />
    </div>
  );
}
```

**Option B: Keep both with toggle (Recommended for testing)**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AdminSkills from '@/components/admin/AdminSkills';
import AdminSkillsNew from '@/components/admin/AdminSkillsNew';

export default function AdminSkillsPage() {
  const [useNewUI, setUseNewUI] = useState(true);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Skills Management</h1>
        <Button
          variant="outline"
          onClick={() => setUseNewUI(!useNewUI)}
        >
          {useNewUI ? '🆕 New UI' : '📜 Old UI'}
        </Button>
      </div>
      
      {useNewUI ? <AdminSkillsNew /> : <AdminSkills />}
    </div>
  );
}
```

## 🧪 Testing

### Test 1: Basic Create Flow
1. Navigate to admin skills page
2. Fill "Tên Skill": "Test Fireball"
3. Check auto-generated ID appears: `test_fireball`
4. Fill description
5. Select category: "Magic"
6. Select skill type: "Active"
7. Go to Effects tab → Add level 1 effects
8. Submit → Should succeed ✅

### Test 2: Effects Builder
1. Create new skill
2. Go to Effects tab
3. Click [Add Level] 3 times → Should have 4 levels
4. Fill different stat bonuses for each level
5. Click [Copy] on level 1 → Should create level 5 with same stats
6. Click [Delete] on level 3 → Should remove it
7. Submit → Check effects in database ✅

### Test 3: Prerequisites
1. Create skill A (basic skill)
2. Create skill B that requires skill A:
   - Go to Prerequisites tab
   - Search for skill A
   - Tick checkbox
   - Submit ✅
3. Verify in database: `prerequisites: ["skill_a_id"]`

### Test 4: Class Restrictions
1. Create new skill
2. Go to Prerequisites tab
3. Tick: Warrior + Knight
4. Submit ✅
5. Verify: `classRestrictions: ["warrior", "knight"]`

### Test 5: Edit Mode
1. Click Edit on existing skill
2. Form should auto-fill all fields
3. Effects should parse correctly into builder
4. Prerequisites checkboxes should be checked
5. Class restrictions should be checked
6. Make changes
7. Update → Should save ✅

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/components/ui/badge'"

**Solution**: Create Badge component (see Step 1 above)

### Issue: "Cannot find module '@/components/ui/separator'"

**Solution**: Create Separator component (see Step 2 above)

### Issue: Tooltip not showing

**Solution**: The tooltip component uses CSS hover. Make sure you have these styles or install Radix UI tooltip:

```bash
npm install @radix-ui/react-tooltip
```

Then replace tooltip.tsx with Radix version.

### Issue: Icons not rendering

**Solution**: Install lucide-react if missing:

```bash
npm install lucide-react
```

### Issue: Dark mode colors wrong

**Solution**: Check your Tailwind config has dark mode enabled:

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

## 📊 Performance Notes

- **Lazy Loading**: Consider code-splitting for large skill lists
- **Debounce Search**: Already implemented for prerequisites search
- **Memoization**: Effects data is managed efficiently
- **Optimistic Updates**: TanStack Query handles caching automatically

## 🎨 Customization

### Change Tab Order
Edit line ~562:
```tsx
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="basic">Basic</TabsTrigger>
  <TabsTrigger value="effects">Effects</TabsTrigger>
  <TabsTrigger value="prereq">Prerequisites</TabsTrigger>
  <TabsTrigger value="combat">Combat</TabsTrigger>
</TabsList>
```

### Add New Stat Bonus
Edit STAT_BONUS_KEYS constant (~82):
```tsx
const STAT_BONUS_KEYS = [
  // ... existing stats
  { key: 'newStat', label: 'New Stat', icon: '🆕', category: 'offense', suffix: '%' },
];
```

### Change Category Colors
Edit SKILL_CATEGORIES constant (~57):
```tsx
const SKILL_CATEGORIES = [
  { value: 'Combat', icon: '⚔️', color: 'bg-red-500' },
  // Change color here ↑
];
```

### Add New Skill Type
Edit SKILL_TYPE_CONFIG constant (~97):
```tsx
const SKILL_TYPE_CONFIG = {
  passive: { ... },
  active: { ... },
  toggle: { ... },
  // Add new type here
  ultimate: {
    label: 'Ultimate',
    icon: Star,
    color: 'bg-yellow-500',
    description: 'Powerful ultimate ability',
    maxSlots: 1,
  },
};
```

## 🚀 Going Live

### Pre-deployment Checklist
- [ ] Test all CRUD operations
- [ ] Verify auto-generated IDs are unique
- [ ] Test with Vietnamese characters
- [ ] Check mobile responsive layout
- [ ] Verify dark mode renders correctly
- [ ] Test with large skill lists (100+ skills)
- [ ] Validate prerequisite circular dependency handling
- [ ] Check API error handling
- [ ] Test with slow network connection
- [ ] Verify tooltips work on all devices

### Recommended Next Steps
1. ✅ Test thoroughly in dev environment
2. ✅ Get feedback from 1-2 admin users
3. ✅ Monitor for any edge cases
4. ✅ Consider adding analytics (track which features used most)
5. ✅ Add keyboard shortcuts for power users
6. ✅ Create admin training video/documentation

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all UI components exist
3. Check API endpoints are accessible
4. Review this guide's troubleshooting section
5. Check the detailed README for feature explanations

---

**Quick Command Reference**:
```bash
# Install missing dependencies
npm install lucide-react
npm install @radix-ui/react-tooltip  # if needed

# Build frontend
npm run build

# Dev mode
npm run dev

# Check for type errors
npm run type-check  # or tsc --noEmit
```

**Status**: Ready to integrate! ✅

Enjoy your new admin experience! 🎉
