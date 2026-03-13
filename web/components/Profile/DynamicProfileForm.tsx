import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
} from "react-native";
import type { ProfileFieldSchema } from "./profileFormSchema";
import { getValueByPath, isFieldVisible } from "./profileFormSchema";

type Props = {
  fields: ProfileFieldSchema[];
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (path: string, value: any) => void;
  parentPath?: string;
  depth?: number;
};

function SelectField({
  label,
  value,
  options = [],
  error,
  required,
  onChange,
}: {
  label: string;
  value: string;
  options?: { label: string; value: string }[];
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    return options.find((item) => item.value === value)?.label || "Select...";
  }, [options, value]);

  return (
    <View style={{ zIndex: 2000 }}>
      <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>

      <View style={{ position: "relative", zIndex: 2000 }}>
        <TouchableOpacity
          onPress={() => setOpen((prev) => !prev)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4"
        >
          <Text className="text-sm text-gray-800">{selectedLabel}</Text>
        </TouchableOpacity>

        {open && (
          <View
            style={{
              position: "absolute",
              top: 58,
              left: 0,
              right: 0,
              zIndex: 9999,
              elevation: 9999,
            }}
            className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden"
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="px-4 py-3 border-b border-gray-100"
              >
                <Text className="text-sm text-gray-800">{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {!!error && <Text className="text-red-500 text-xs mt-2">{error}</Text>}
    </View>
  );
}

function DynamicProfileForm({
  fields,
  values,
  errors,
  onChange,
  parentPath = "",
  depth = 0,
}: Props) {
  return (
    <View className="gap-4">
      {fields.map((field) => {
        if (!isFieldVisible(field, values, parentPath)) return null;

        const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;
        const value = getValueByPath(values, fullName);
        const error = errors[fullName];

        if (field.type === "group") {
          return (
            <View
              key={fullName}
              className="bg-gray-50 border border-gray-200 rounded-2xl p-4"
              style={{ marginLeft: depth > 0 ? 8 : 0 }}
            >
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                {field.label}
              </Text>

              <DynamicProfileForm
                fields={field.fields || []}
                values={values}
                errors={errors}
                onChange={onChange}
                parentPath={fullName}
                depth={depth + 1}
              />
            </View>
          );
        }

        if (field.type === "switch") {
          return (
            <View
              key={fullName}
              className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <View className="pr-4 flex-1">
                <Text className="text-sm font-medium text-gray-800">
                  {field.label}
                  {field.required ? <Text className="text-red-500"> *</Text> : null}
                </Text>
              </View>

              <Switch
                value={!!value}
                onValueChange={(next) => onChange(fullName, next)}
              />
            </View>
          );
        }

        if (field.type === "select") {
          return (
            <SelectField
              key={fullName}
              label={field.label}
              value={typeof value === "string" ? value : ""}
              options={field.options}
              error={error}
              required={field.required}
              onChange={(next) => onChange(fullName, next)}
            />
          );
        }

        return (
          <View key={fullName}>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {field.label}
              {field.required ? <Text className="text-red-500"> *</Text> : null}
            </Text>

            <TextInput
              value={typeof value === "string" ? value : value ? String(value) : ""}
              onChangeText={(text) => onChange(fullName, text)}
              placeholder={field.placeholder}
              placeholderTextColor="#9ca3af"
              multiline={field.type === "textarea"}
              numberOfLines={field.type === "textarea" ? 4 : 1}
              className="bg-white border border-gray-200 rounded-xl p-4 text-gray-700 text-sm"
              style={
                field.type === "textarea"
                  ? ({ minHeight: 96, outline: "none", textAlignVertical: "top" } as any)
                  : ({ outline: "none" } as any)
              }
            />

            {!!error && <Text className="text-red-500 text-xs mt-2">{error}</Text>}
          </View>
        );
      })}
    </View>
  );
}

export default DynamicProfileForm;