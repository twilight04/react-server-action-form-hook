import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter as useNextRouter } from 'next/navigation';
import { useRouter as useToploaderRouter } from 'nextjs-toploader/app';
import { startTransition, useEffect, useRef, useActionState } from "react";
import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Represents the state returned by a server action, indicating success or failure
 * and providing a corresponding message.
 */
export interface ServerActionState {
  success: boolean;
  message: string;
  // validationErrors?: Record<string, string[]>; // Consider adding for field-specific errors
}

/**
 * Configuration options for the useServerActionForm hook.
 * @template TInput The Zod schema type for form validation.
 */
interface UseServerActionFormOptions<TInput extends z.ZodTypeAny> {
  /** The Zod schema used to validate the form data before submission. */
  schema: TInput;
  /**
   * The server action function to execute.
   * It receives the previous state and the validated form data.
   * It must return a Promise resolving to a ServerActionState or undefined.
   */
  action: (
    prevState: ServerActionState | undefined,
    data: z.infer<TInput>
  ) => Promise<ServerActionState | undefined>;
  /** Default values for the form fields. */
  defaultValues: UseFormProps<z.infer<TInput>>["defaultValues"];
  /** The initial state for the server action. Defaults to undefined. */
  initialState?: ServerActionState | undefined;
  /** If true, uses the router from `nextjs-toploader/app` for redirects, enabling the top loader bar. Defaults to false (uses `next/navigation`). */
  useLoaderRouter?: boolean;
  /** Whether to reset the form upon successful action execution. Defaults to true. */
  resetOnSuccess?: boolean;
  /** Optional URL to redirect to upon successful action execution. */
  redirectUrl?: string;
  /**
   * Controls the success toast message.
   * - `true`: Show toast with the success message from the action state.
   * - `string`: Show toast with the provided string.
   * - `false`: Disable success toast.
   * Defaults to true.
   */
  successToast?: boolean | string;
  /**
   * Controls the error toast message.
   * - `true`: Show toast with the error message from the action state.
   * - `string`: Show toast with the provided string.
   * - `false`: Disable error toast.
   * Defaults to true.
   */
  errorToast?: boolean | string;
  /** Optional callback function to execute upon successful action execution (if not redirecting). */
  onSuccess?: (state: ServerActionState) => void;
  /** Optional callback function to execute upon failed action execution. */
  onError?: (state: ServerActionState) => void;
}

/**
 * The return value of the useServerActionForm hook.
 * @template TInput The Zod schema type for form validation.
 */
interface UseServerActionFormReturn<TInput extends z.ZodTypeAny> {
  /** The React Hook Form instance. */
  form: UseFormReturn<z.infer<TInput>>;
  /** The function to pass to the form's onSubmit handler. Triggers the server action. */
  onSubmit: (data: z.infer<TInput>) => void;
  /** A boolean indicating if the server action is currently pending. */
  pending: boolean;
  /** The current state returned by the most recent server action execution. */
  state: ServerActionState | undefined;
}

/**
 * A hook to streamline the integration of React Hook Form with React Server Actions.
 * It handles form validation, action execution using `useActionState`, state management,
 * pending states, toast notifications, form resets, and redirects.
 * You can optionally use the `nextjs-toploader` router by setting `useLoaderRouter` to true.
 *
 * @template TInput The Zod schema type for form validation.
 * @param {UseServerActionFormOptions<TInput>} options Configuration options for the hook.
 * @returns {UseServerActionFormReturn<TInput>} An object containing the form instance, submit handler, pending state, and action state.
 */
export function useServerActionForm<TInput extends z.ZodTypeAny>({
  schema,
  action,
  defaultValues,
  initialState = undefined,
  useLoaderRouter = false, // Default to false (use next/navigation)
  resetOnSuccess = true,
  redirectUrl,
  successToast = true,
  errorToast = true,
  onSuccess,
  onError,
}: UseServerActionFormOptions<TInput>): UseServerActionFormReturn<TInput> {
  "use no memo"; // Recommended when using React Compiler (Forget)

  // Conditionally select the router hook based on the option
  const router = useLoaderRouter ? useToploaderRouter() : useNextRouter();

  const processedStateRef = useRef<ServerActionState | undefined>(undefined);
  const isRedirectingRef = useRef(false);

  const form = useForm<z.infer<TInput>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
  });

  const [state, formAction, pending] = useActionState<
    ServerActionState | undefined,
    z.infer<TInput>
  >(action, initialState);

  const onSubmit = (data: z.infer<TInput>) => {
    isRedirectingRef.current = false;
    // Note: processedStateRef is reset in the effect watching `pending`
    startTransition(() => {
      formAction(data);
    });
  };

  useEffect(() => {
    // Prevent processing if no state, action pending, state already processed, or redirecting
    if (
      !state ||
      pending ||
      state === processedStateRef.current ||
      isRedirectingRef.current
    ) {
      return;
    }

    // Mark state as processed *before* potential async/side-effect operations
    processedStateRef.current = state;

    if (state.success) {
      // Success
      if (successToast) {
        const message =
          typeof successToast === "string" ? successToast : state.message;
        toast.success(message);
      }

      if (redirectUrl) {
        isRedirectingRef.current = true;
        startTransition(() => {
          router.push(redirectUrl);
          // Intentionally return early after initiating redirect
        });
        return; // Exit effect early if redirecting
      }

      // Only reset/call onSuccess if not redirecting
      if (resetOnSuccess) {
        form.reset();
      }
      onSuccess?.(state);
    } else {
      // Error
      if (errorToast) {
        const message =
          typeof errorToast === "string" ? errorToast : state.message;
        toast.error(message);
      }
      // Optional: Handle specific validation errors if implemented in ServerActionState
      // if (state.validationErrors) { ... }
      onError?.(state);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state,
    pending,
    // Stable dependencies:
    form,
    router, // Router instance is stable within component lifetime
    resetOnSuccess,
    redirectUrl,
    successToast,
    errorToast,
    onSuccess,
    onError,
  ]);

  // Reset refs when a new action starts
  useEffect(() => {
    if (pending) {
      processedStateRef.current = undefined;
      isRedirectingRef.current = false;
    }
  }, [pending]);

  return {
    form,
    onSubmit,
    pending,
    state,
  };
}