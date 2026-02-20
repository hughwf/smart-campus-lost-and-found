# Components

React components used across the application. All components use Tailwind CSS for styling and are TypeScript-typed.

---

## PhotoUpload

**File:** `components/PhotoUpload.tsx`

A reusable photo upload widget with drag-and-drop, client-side image compression, preview, and AI-powered metadata generation via the Gemini API.

### Props

```ts
interface PhotoUploadProps {
  type: "lost" | "found";
  required?: boolean;
  onPhotoSelected: (file: File) => void;
  onGenerated: (data: {
    title: string;
    description: string;
    extracted: ExtractedAttributes;
  }) => void;
  onGenerateError: () => void;
}
```

| Prop              | Type       | Default | Description                                                        |
|-------------------|------------|---------|--------------------------------------------------------------------|
| `type`            | `string`   | —       | `"lost"` or `"found"` — passed to the generate endpoint for prompt context |
| `required`        | `boolean`  | `false` | Whether a photo is required for form submission                    |
| `onPhotoSelected` | `function` | —       | Called with the compressed `File` after compression completes       |
| `onGenerated`     | `function` | —       | Called with the AI-generated title, description, and extracted attributes |
| `onGenerateError` | `function` | —       | Called when AI generation fails — parent should enable manual entry |

### Usage

```tsx
import PhotoUpload from "@/components/PhotoUpload";

function ReportForm() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <PhotoUpload
      type="found"
      required
      onPhotoSelected={(file) => setPhoto(file)}
      onGenerated={(data) => {
        setTitle(data.title);
        setDescription(data.description);
      }}
      onGenerateError={() => {
        // Fields remain empty — user fills in manually
      }}
    />
  );
}
```

### Behavior

1. **Upload** — User drags and drops a photo or clicks the drop zone to open a file picker. On mobile, the `capture="environment"` attribute opens the device camera.
2. **Preview** — An image preview displays immediately from the original file (before compression).
3. **Compression** — The image is compressed client-side using `browser-image-compression` targeting ~500KB and max 1920px on the longest side. A spinner overlay shows "Compressing image..." during this step.
4. **Generation** — The compressed file is sent to `POST /api/items/generate` for AI analysis. A spinner overlay shows "Analyzing photo with AI..." during this step.
5. **Completion** — On success, a green "AI details generated" badge appears and `onGenerated` is called. On failure, an error message is shown and `onGenerateError` is called so the parent can fall back to manual entry.
6. **Removal** — A close button on the preview resets the component to the initial drop zone state.

### Accepted File Types

`image/jpeg`, `image/png`, `image/webp`, `image/heic`

### Compression Settings

| Option              | Value         |
|---------------------|---------------|
| `maxSizeMB`         | `0.5` (500KB) |
| `maxWidthOrHeight`  | `1920`        |
| `useWebWorker`      | `true`        |
| `fileType`          | `image/jpeg`  |

If compression fails (e.g. unsupported format), the original file is used as a fallback.

### States

| State          | UI                                                   |
|----------------|------------------------------------------------------|
| `idle`         | Drop zone with upload icon and instructions           |
| `compressing`  | Image preview with spinner overlay — "Compressing..." |
| `generating`   | Image preview with spinner overlay — "Analyzing..."   |
| `done`         | Image preview with green success badge                |
| `error`        | Image preview with red error message below            |

### Dependencies

- [`browser-image-compression`](https://www.npmjs.com/package/browser-image-compression) — Client-side image compression
- `POST /api/items/generate` — Gemini AI title/description generation (see [api.md](./api.md))

---

## Header

**File:** `components/Header.tsx`

Navigation bar with authentication state. Shows sign-in button for unauthenticated users, and user profile with "My Items" link and sign-out for authenticated users.

---

## Providers

**File:** `components/Providers.tsx`

NextAuth `SessionProvider` wrapper used in the root layout to provide session context to all client components.

---

## ItemCard

**File:** `components/ItemCard.tsx`

*Stub — implementation tracked in Issue #8.*

---

## ItemForm

**File:** `components/ItemForm.tsx`

*Stub — implementation tracked in Issue #8.*

---

## MatchCard

**File:** `components/MatchCard.tsx`

*Stub — implementation tracked in Issue #8.*
