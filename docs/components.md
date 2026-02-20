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

A reusable form component for reporting lost and found items. Integrates `PhotoUpload` for AI-powered photo analysis, provides editable fields for title and description (pre-filled by Gemini), and handles form submission to `POST /api/items` with automatic redirect on success.

### Props

```ts
interface ItemFormProps {
  type: "lost" | "found";
}
```

| Prop   | Type     | Description                                                                     |
|--------|----------|---------------------------------------------------------------------------------|
| `type` | `string` | `"lost"` or `"found"` — controls conditional fields, button color, and labels   |

### Usage

```tsx
import ItemForm from "@/components/ItemForm";

// On the Report Found page
export default function ReportFoundPage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1>Report a Found Item</h1>
      <ItemForm type="found" />
    </div>
  );
}
```

### Fields

| Field       | Type      | Required    | Description                                                      |
|-------------|-----------|-------------|------------------------------------------------------------------|
| Photo       | File      | Found: yes, Lost: no | Drag-and-drop or click upload via `PhotoUpload` component |
| Title       | Text      | Yes         | Pre-filled by Gemini AI if photo uploaded, editable by user      |
| Description | Textarea  | Yes         | Pre-filled by Gemini AI if photo uploaded, editable by user      |
| Location    | Select    | Yes         | Dropdown of campus landmarks with "Other" free-text option       |
| Taken       | Toggle    | Found only  | "I took it with me" / "I left it at the location"               |
| Reward      | Text      | Lost only   | Optional reward offered for return                               |

### Campus Locations

The location dropdown includes these predefined options plus an "Other" free-text option:

Student Union, Main Library, Science Building, Engineering Hall, Recreation Center, Dining Hall, Parking Garage A, Parking Garage B, Arts Building, Business School, Health Center, Residence Halls, Athletic Fields, Campus Bookstore.

### Behavior

1. **Photo Upload** — The `PhotoUpload` component handles drag-and-drop, compression, and AI generation. When Gemini returns results, the title, description, and extracted attributes are auto-filled with an "AI-suggested" hint.
2. **AI Pre-fill** — Title and description show a green "AI-suggested — edit if needed" hint when populated by Gemini. Users can freely edit these fields.
3. **Location Selection** — A dropdown of common campus landmarks. Selecting "Other" reveals a free-text input field.
4. **Conditional Fields** — Found items show a taken/left toggle. Lost items show an optional reward field.
5. **Validation** — Title, description, and location are required. The submit button is disabled until all required fields are filled.
6. **Submission** — Sends `multipart/form-data` to `POST /api/items` with all fields including the photo file and extracted attributes JSON. A loading spinner shows "Submitting & finding matches..." during the request.
7. **Redirect** — On success, navigates to `/items/{id}` (the item detail page) using Next.js router.
8. **Error Handling** — API errors are displayed in a red banner above the submit button. The form remains editable so the user can retry.

### Conditional Rendering by Type

| Feature          | `type="found"`                               | `type="lost"`                         |
|------------------|----------------------------------------------|---------------------------------------|
| Photo            | Required                                     | Optional (helps finders confirm)      |
| Taken toggle     | Shown — "I took it with me" / "I left it"   | Hidden                                |
| Reward field     | Hidden                                       | Shown — optional text                 |
| Submit button    | Green — "Report Found Item"                  | Red — "Report Lost Item"              |
| Location prompt  | "Where did you find it?"                     | "Where did you lose it?"              |

### Dependencies

- [`PhotoUpload`](#photoupload) — Photo upload with compression and AI generation
- `POST /api/items` — Item creation endpoint (see [api.md](./api.md))
- `next/navigation` — `useRouter` for post-submission redirect

---

## MatchCard

**File:** `components/MatchCard.tsx`

*Stub — implementation tracked in Issue #8.*
