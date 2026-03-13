export type FieldOption = {
  label: string;
  value: string;
};

export type ShowWhenRule = {
  field: string;
  equals?: string | boolean | number;
};

export type ProfileFieldSchema = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "switch" | "group";
  required?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  defaultValue?: any;
  options?: FieldOption[];
  showWhen?: ShowWhenRule;
  fields?: ProfileFieldSchema[];
};

export type FormValues = Record<string, any>;
export type FormErrors = Record<string, string>;

export function cloneSchema<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function getValueByPath(obj: any, path: string) {
  if (!path) return obj;
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}

export function setValueByPath(obj: any, path: string, value: any) {
  const keys = path.split(".");
  const next = { ...(obj || {}) };
  let cursor = next;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    cursor[key] =
      cursor[key] && typeof cursor[key] === "object"
        ? { ...cursor[key] }
        : {};
    cursor = cursor[key];
  }

  cursor[keys[keys.length - 1]] = value;
  return next;
}

export function isFieldVisible(
  field: ProfileFieldSchema,
  values: FormValues,
  parentPath = ""
) {
  if (!field.showWhen) return true;

  const rawPath = field.showWhen.field;
  const fullPath =
    rawPath.includes(".") || !parentPath ? rawPath : `${parentPath}.${rawPath}`;

  const actual = getValueByPath(values, fullPath);

  if (typeof field.showWhen.equals !== "undefined") {
    return actual === field.showWhen.equals;
  }

  return !!actual;
}

export function applyDefaultsFromSchema(
  fields: ProfileFieldSchema[],
  seed: FormValues = {},
  parentPath = ""
) {
  let next = { ...(seed || {}) };

  for (const field of fields) {
    const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;
    const currentValue = getValueByPath(next, fullName);

    if (field.type === "group") {
      if (typeof currentValue === "undefined") {
        next = setValueByPath(next, fullName, {});
      }

      next = applyDefaultsFromSchema(
        field.fields || [],
        next,
        fullName
      );
      continue;
    }

    if (typeof currentValue === "undefined") {
      if (typeof field.defaultValue !== "undefined") {
        next = setValueByPath(next, fullName, field.defaultValue);
      } else if (field.type === "switch") {
        next = setValueByPath(next, fullName, false);
      } else {
        next = setValueByPath(next, fullName, "");
      }
    }
  }

  return next;
}

export function normalizeProfileSchema(
  fields: ProfileFieldSchema[]
): ProfileFieldSchema[] {
  return cloneSchema(fields);
}

export function validateBySchema(
  fields: ProfileFieldSchema[],
  values: FormValues,
  parentPath = ""
): FormErrors {
  let errors: FormErrors = {};

  for (const field of fields) {
    if (!isFieldVisible(field, values, parentPath)) continue;

    const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;

    if (field.type === "group") {
      errors = {
        ...errors,
        ...validateBySchema(field.fields || [], values, fullName),
      };
      continue;
    }

    const rawValue = getValueByPath(values, fullName);
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (field.required) {
      const empty =
        value === "" || value === null || typeof value === "undefined";
      if (empty) {
        errors[fullName] = `${field.label} is required`;
        continue;
      }
    }

    if (typeof value === "string" && typeof field.min === "number" && value.length < field.min) {
      errors[fullName] = `${field.label} must be at least ${field.min} characters`;
      continue;
    }

    if (typeof value === "string" && typeof field.max === "number" && value.length > field.max) {
      errors[fullName] = `${field.label} must be at most ${field.max} characters`;
      continue;
    }
  }

  return errors;
}

export function buildPayloadFromSchema(
  fields: ProfileFieldSchema[],
  values: FormValues,
  parentPath = ""
) {
  const result: Record<string, any> = {};

  for (const field of fields) {
    if (!isFieldVisible(field, values, parentPath)) continue;

    const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;
    const currentValue = getValueByPath(values, fullName);

    if (field.type === "group") {
      result[field.name] = buildPayloadFromSchema(
        field.fields || [],
        values,
        fullName
      );
      continue;
    }

    result[field.name] = currentValue;
  }

  return result;
}