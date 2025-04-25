# React Server Action Form Hook

A React hook to integrate React Hook Form with Next.js Server Actions using Zod validation. This hook handles state, loading, toast notifications, form resets, and redirects efficiently.

## Features

- Integrates **React Hook Form** with **Next.js Server Actions**.
- Validates form data using **Zod** schemas.
- Provides seamless handling of **pending** states, form resets, **toast notifications**, and **redirects**.
- Customizable success and error toast messages.
- Supports **top loader bar** with `nextjs-toploader` (optional).
- Automatically resets the form and calls `onSuccess` upon successful submission.

## Installation

Install the package using npm or yarn:

```bash
npm install react-server-action-form-hook
# or
yarn add react-server-action-form-hook
```

### Peer Dependencies

Ensure you have the following peer dependencies installed in your project:

- `@hookform/resolvers`: `^3.9.0` (or compatible version for Zod v5)
- `next`: `^14.0.0` (or newer versions supporting Server Actions)
- `react`: `^18.2.0`
- `react-hook-form`: `^7.50.0`
- `sonner`: `^1.0.0`
- `zod`: `^3.20.0`

Optional peer dependency for the top loader feature:

- `nextjs-toploader`: `^1.6.0`

_Note: Version numbers are examples; ensure compatibility with your project._

### Dev Dependencies (for contributing or development)

- `@types/node`: `^20.11.0`
- `@types/react`: `^18.2.0`
- `tsup`: `^8.0.0`
- `typescript`: `^5.3.0`

## Usage

Here’s an example demonstrating how to use the `useServerActionForm` hook with a typical Next.js project structure.

### 1. Define your Zod Schema (`schema.ts`)

Create a file to define the validation schema for your form data.

```typescript
// src/lib/schema.ts (or your preferred location)
import { z } from "zod";

export const todoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
});

export type TodoSchema = z.infer<typeof todoSchema>;
```

### 2. Define your Server Action (`actions.ts`)

Create a file for your Next.js Server Action. This function will receive the validated form data and should return a `ServerActionState`. Remember to include `"use server";` at the top.

```typescript
// src/app/actions.ts (or your preferred location)
"use server";

import { z } from "zod";
import { todoSchema, type TodoSchema } from "@/lib/schema"; // Adjust import path
import type { ServerActionState } from "react-server-action-form-hook";

export async function createTodoAction(
  // The previous state is not used here but is required by useFormState
  _prevState: ServerActionState | undefined,
  formData: TodoSchema
): Promise<ServerActionState | undefined> {
  try {
    // Validate data again on the server (optional but recommended)
    // The hook already validates on the client, but server validation adds security.
    const validatedData = todoSchema.parse(formData);

    console.log("Server Action Received:", validatedData);
    // Simulate database operation or API call
    // await db.createTodo(validatedData);

    // Simulate success
    return { success: true, message: "Todo created successfully!" };
  } catch (error) {
    console.error("Server Action Error:", error);
    if (error instanceof z.ZodError) {
      // Although client-side validation exists, handle potential server-side Zod errors
      return {
        success: false,
        message: "Validation failed on server.",
        // Optionally map Zod errors to validationErrors if needed,
        // but typically client-side validation handles this.
        // validationErrors: error.flatten().fieldErrors
      };
    }
    // Handle other potential errors (e.g., database errors)
    return { success: false, message: "An unexpected error occurred." };
  }
}
```

### 3. Implement the Form Component (`form.tsx`)

Create your React component using the hook. Make sure it's a Client Component (`"use client";`).

```tsx
// src/components/TodoForm.tsx (or your preferred location)
"use client";

import { useServerActionForm } from "react-server-action-form-hook";
import { createTodoAction } from "@/app/actions"; // Adjust import path
import { todoSchema } from "@/lib/schema"; // Adjust import path

export default function TodoForm() {
  const { form, onSubmit, pending, state } = useServerActionForm({
    schema: todoSchema,
    action: createTodoAction,
    defaultValues: {
      title: "",
      description: "",
    },
    redirectUrl: "/todos", // Redirect to the todo list page on success
    // Optional: Customize toast messages
    // successToast: "Great! Your todo has been added.",
    // errorToast: "Oops! Something went wrong.",
  });

  return (
    // form.handleSubmit wraps your onSubmit, handles validation,
    // and then calls the server action via the hook's internal logic.
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          id="title"
          type="text"
          {...form.register("title")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          aria-invalid={form.formState.errors.title ? "true" : "false"}
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description (Optional)
        </label>
        <textarea
          id="description"
          {...form.register("description")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {/* No error display needed for optional field unless specific validation added */}
      </div>

      {/* Display general server action messages (optional) */}
      {state && !state.success && state.message && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending} // Disable button while action is pending
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Create Todo"}
      </button>
    </form>
  );
}
```

### Optional: Using `nextjs-toploader`

To display a progress bar at the top of the page during form submission redirects (when `redirectUrl` is used), you can integrate `nextjs-toploader`.

1.  **Install `nextjs-toploader`**:

    ```bash
    npm install nextjs-toploader
    # or
    yarn add nextjs-toploader
    ```

2.  **Add `NextTopLoader` to your Root Layout**:
    Include the `<NextTopLoader />` component in your main `layout.tsx` (or `layout.js`) file, typically within the `<body>` tag.

    ```tsx
    // src/app/layout.tsx
    import NextTopLoader from "nextjs-toploader";
    import "./globals.css"; // Your global styles
    import { Toaster } from "sonner"; // Import toaster for notifications

    export default function RootLayout({
      children,
    }: Readonly<{
      children: React.ReactNode;
    }>) {
      return (
        <html lang="en">
          <body>
            <NextTopLoader
              color="#2299DD" // Customize color if desired
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={true}
              showSpinner={true}
              easing="ease"
              speed={200}
              shadow="0 0 10px #2299DD,0 0 5px #2299DD"
            />
            {children}
            <Toaster richColors /> {/* Add Sonner Toaster here */}
          </body>
        </html>
      );
    }
    ```

    _Note: Also ensure you have `<Toaster />` from `sonner` added to your layout for toast notifications to work._

3.  **Enable Loader in the Hook**:
    Set the `useLoaderRouter` option to `true` in your `useServerActionForm` configuration.

    ```tsx
    // src/components/TodoForm.tsx (inside the component)
    const { form, onSubmit, pending } = useServerActionForm({
      schema: todoSchema,
      action: createTodoAction,
      defaultValues: {
        /* ... */
      },
      redirectUrl: "/todos",
      useLoaderRouter: true, // Enable the top loader for redirects
    });
    ```

Now, when the form submission is successful and a `redirectUrl` is provided, `nextjs-toploader` will automatically display the progress bar during the navigation. This feature relies specifically on the Next.js environment and the `nextjs-toploader` library.

### `useServerActionForm` Hook Configuration

The hook accepts an options object with the following properties:

```ts
import { type UseFormProps } from "react-hook-form";
import { type z } from "zod";
import type { ServerActionState } from "./types"; // Assuming types are defined here

interface UseServerActionFormOptions<TInput extends z.ZodTypeAny> {
  // Core Configuration
  schema: TInput; // Zod schema for client-side validation.
  action: (
    prevState: ServerActionState | undefined,
    data: z.infer<TInput>
  ) => Promise<ServerActionState | undefined>; // The Server Action function to execute.
  defaultValues: UseFormProps<z.infer<TInput>>["defaultValues"]; // Default values for React Hook Form.

  // Optional Configuration
  initialState?: ServerActionState; // Initial state for the server action response (optional).
  resetOnSuccess?: boolean; // Reset the form fields upon successful submission (default: true).
  redirectUrl?: string; // URL to redirect to after a successful action (optional).
  useLoaderRouter?: boolean; // Use `nextjs-toploader` for redirects if installed and configured (default: false).
  successToast?: boolean | string; // Show a success toast notification (default: true). Provide a string for a custom message.
  errorToast?: boolean | string; // Show an error toast notification (default: true). Provide a string for a custom message.
  onSuccess?: (state: ServerActionState) => void; // Callback function executed on successful action (after reset/redirect logic).
  onError?: (state: ServerActionState) => void; // Callback function executed on failed action.
}
```

### Return Value

The hook returns an object containing:

```ts
import { type UseFormReturn } from "react-hook-form";
import { type z } from "zod";
import type { ServerActionState } from "./types"; // Assuming types are defined here

interface UseServerActionFormReturn<TInput extends z.ZodTypeAny> {
  form: UseFormReturn<z.infer<TInput>>; // The React Hook Form instance (`register`, `handleSubmit`, `formState`, etc.).
  onSubmit: (data: z.infer<TInput>) => void; // The function to pass to your form's `onSubmit` prop after wrapping with `form.handleSubmit`.
  pending: boolean; // Boolean indicating if the server action is currently executing.
  state: ServerActionState | undefined; // The current state returned by the last server action execution.
}
```

## Server Action State

Your server action function **must** return an object adhering to the `ServerActionState` interface, or `undefined`.

```ts
interface ServerActionState {
  success: boolean; // Indicates if the action was successful.
  message: string; // A message describing the outcome (success or error).
  // validationErrors?: Record<string, string[]>; // Optional: Field-specific errors (usually handled by client-side Zod validation).
  // You can add other custom fields to the state if needed.
}
```

## Customization

- **Toast Notifications**: Control success and error toasts using `successToast` and `errorToast`. Set to `false` to disable, `true` for default messages (using the `message` from `ServerActionState`), or provide a custom string. Requires `sonner` to be installed and `<Toaster />` rendered in your layout.
- **Redirects**: Use `redirectUrl` to automatically navigate the user upon successful form submission.
- **Top Loader**: Enable a visual loading indicator during redirects with `useLoaderRouter: true` (requires `nextjs-toploader` setup).
- **Callbacks**: Use `onSuccess` and `onError` for custom logic after the action completes (e.g., analytics, closing modals).

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/twilight04/react-server-action-form-hook/blob/master/LICENSE.txt) file for details.

## Bugs & Issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/twilight04/react-server-action-form-hook/issues).

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

---

Developed by [JC Tecson](https://github.com/twilight04).
