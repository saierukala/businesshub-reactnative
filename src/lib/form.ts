import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { ApiError } from "@/lib/api";

// Shows an API error on the form: backend validation issues go under their fields,
// anything else becomes the form-level message (rendered by <FormAlert>).
export function showApiError<T extends FieldValues>(form: Pick<UseFormReturn<T>, "getValues" | "setError">, err: unknown) {
  const fields = Object.keys(form.getValues());
  if (err instanceof ApiError) {
    const issues = err.fieldIssues.filter((i) => fields.includes(i.path));
    issues.forEach((i) => form.setError(i.path as Path<T>, { message: i.message }));
    if (issues.length === 0) form.setError("root.server", { message: err.message });
    return;
  }
  form.setError("root.server", { message: "Something went wrong. Please try again." });
}
