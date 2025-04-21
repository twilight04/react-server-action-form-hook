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

- `@hookform/resolvers`: `^5.0.1`
- `next`: `^15.3.1`
- `nextjs-toploader`: `^3.8.16`
- `react`: `^19.1.0`
- `react-hook-form`: `^7.56.0`
- `sonner`: `^2.0.3`
- `zod`: `^3.24.3`

### Dev Dependencies

- `@types/node`: `^22.14.1`
- `@types/react`: `^19.1.2`
- `tsup`: `^8.4.0`
- `typescript`: `^5.8.3`

## Usage

### Example

Here’s a basic example of how to use the `useServerActionForm` hook.

```tsx
import { z } from "zod";
import { useServerActionForm } from "react-server-action-form-hook";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

// Define your Zod schema
const schema = z.object({
  email: z.string().email().min(1),
  password: z.string().min(6),
});

// Define your server action function
async function submitForm(prevState, data) {
  // Simulate server logic
  if (data.email === "error@example.com") {
    return { success: false, message: "Email already in use!" };
  }
  return { success: true, message: "Form submitted successfully!" };
}

// Component
export default function ExampleForm() {
  const { form, onSubmit, pending, state } = useServerActionForm({
    schema,
    action: submitForm,
    defaultValues: { email: "", password: "" },
    successToast: true, // Enable success toast
    errorToast: true,   // Enable error toast
    onSuccess: (state) => toast.success(state.message),
    onError: (state) => toast.error(state.message),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("email")} placeholder="Email" />
      <input {...form.register("password")} placeholder="Password" />
      <button type="submit" disabled={pending}>Submit</button>
    </form>
  );
}
```

### `useServerActionForm` Hook Configuration

The hook accepts the following options:

```ts
interface UseServerActionFormOptions<TInput extends z.ZodTypeAny> {
  schema: TInput; // Zod schema for form validation
  action: (prevState: ServerActionState | undefined, data: z.infer<TInput>) => Promise<ServerActionState | undefined>; // Server action to execute
  defaultValues: UseFormProps<z.infer<TInput>>["defaultValues"]; // Default form values
  initialState?: ServerActionState; // Initial state for server action
  useLoaderRouter?: boolean; // Use `nextjs-toploader` router for redirects (optional)
  resetOnSuccess?: boolean; // Reset form upon success (default: true)
  redirectUrl?: string; // URL to redirect after success
  successToast?: boolean | string; // Show success toast message (default: true)
  errorToast?: boolean | string; // Show error toast message (default: true)
  onSuccess?: (state: ServerActionState) => void; // Callback on success
  onError?: (state: ServerActionState) => void; // Callback on error
}
```

### Return Value

The hook returns the following object:

```ts
interface UseServerActionFormReturn<TInput extends z.ZodTypeAny> {
  form: UseFormReturn<z.infer<TInput>>; // React Hook Form instance
  onSubmit: (data: z.infer<TInput>) => void; // Function to submit the form
  pending: boolean; // Indicates if the server action is pending
  state: ServerActionState | undefined; // Current state of the server action
}
```

## Server Action State

The `ServerActionState` interface defines the state returned by the server action function:

```ts
interface ServerActionState {
  success: boolean; // Whether the action was successful
  message: string;  // Success or error message
  // validationErrors?: Record<string, string[]>; // (Optional) Field-specific validation errors
}
```

## Customization

- **Success/Failure Toasts**: Customize the toast messages by passing either `true` for default behavior or a custom string.
- **Redirects**: The hook supports automatic redirects upon successful action execution. You can provide a `redirectUrl` for the desired redirection target.
- **Top Loader**: Optionally enable the top loader bar during redirects by setting `useLoaderRouter` to `true`.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/twilight04/react-server-action-form-hook/blob/main/LICENSE) file for details.

## Bugs & Issues

If you encounter any issues, feel free to [open an issue](https://github.com/twilight04/react-server-action-form-hook/issues).

## Contributing

We welcome contributions! Please fork the repository and submit pull requests for any improvements or bug fixes.

---

Developed by [JC Tecson](https://github.com/twilight04).

This `README.md` provides the key details for using the hook, setting up the environment, customizing behavior, and understanding the main concepts.