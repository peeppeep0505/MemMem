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
import { useAppTheme } from "@/contexts/ThemeContext";
import { Fonts, Glyphs } from "@/constants/theme";

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
  const { theme: C } = useAppTheme();
  const F = Fonts as any;
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(() => {
    return options.find((item) => item.value === value)?.label || "Select…";
  }, [options, value]);

  return (
    <View style={{ zIndex: 2000 }}>
      {/* Label */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 2.5,
          textTransform: "uppercase",
          color: C.mutedText,
          marginBottom: 8,
        }}
      >
        {label}
        {required && <Text style={{ color: C.logout }}> *</Text>}
      </Text>

      <View style={{ position: "relative", zIndex: 2000 }}>
        <TouchableOpacity
          onPress={() => setOpen((prev) => !prev)}
          style={{
            backgroundColor: C.primarySoft,
            borderWidth: 1,
            borderColor: open ? C.primary : C.border,
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 14, color: C.inkText, fontFamily: F?.sans }}>
            {selectedLabel}
          </Text>
          <Text style={{ fontSize: 11, color: C.accent }}>
            {open ? "▴" : "▾"}
          </Text>
        </TouchableOpacity>

        {open && (
          <View
            style={{
              position: "absolute",
              top: 54,
              left: 0,
              right: 0,
              zIndex: 9999,
              elevation: 9999,
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 14,
              overflow: "hidden",
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
            }}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => { onChange(option.value); setOpen(false); }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: C.ruledLine,
                  backgroundColor:
                    option.value === value ? C.primarySoft : C.surface,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: option.value === value ? C.primary : C.inkText,
                    fontWeight: option.value === value ? "600" : "400",
                    fontFamily: F?.sans,
                  }}
                >
                  {option.label}
                  {option.value === value && ` ${Glyphs.heart}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {!!error && (
        <Text style={{ fontSize: 12, color: C.logout, marginTop: 6 }}>{error}</Text>
      )}
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
  const { theme: C } = useAppTheme();
  const F = Fonts as any;

  const fieldLabelStyle = {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
    color: C.mutedText,
    marginBottom: 8,
  };

  return (
    <View style={{ gap: 16 }}>
      {fields.map((field) => {
        if (!isFieldVisible(field, values, parentPath)) return null;

        const fullName = parentPath ? `${parentPath}.${field.name}` : field.name;
        const value    = getValueByPath(values, fullName);
        const error    = errors[fullName];

        // ── group ──────────────────────────────────────────────────────────
        if (field.type === "group") {
          return (
            <View
              key={fullName}
              style={{
                backgroundColor: C.primarySoft,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 18,
                padding: 16,
                marginLeft: depth > 0 ? 8 : 0,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: C.accent }}>{Glyphs.floral}</Text>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.inkText, fontFamily: F?.sans }}>
                  {field.label}
                </Text>
              </View>

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

        // ── switch ─────────────────────────────────────────────────────────
        if (field.type === "switch") {
          return (
            <View
              key={fullName}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: value ? C.border : C.ruledLine,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <View style={{ paddingRight: 16, flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: C.inkText, fontFamily: F?.sans }}>
                  {field.label}
                  {field.required && <Text style={{ color: C.logout }}> *</Text>}
                </Text>
              </View>

              <Switch
                value={!!value}
                onValueChange={(next) => onChange(fullName, next)}
                trackColor={{ false: C.ruledLine, true: C.accent }}
                thumbColor={value ? C.primary : C.mutedText}
              />
            </View>
          );
        }

        // ── select ─────────────────────────────────────────────────────────
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

        // ── text / textarea ────────────────────────────────────────────────
        return (
          <View key={fullName}>
            <Text style={fieldLabelStyle}>
              {field.label}
              {field.required && <Text style={{ color: C.logout }}> *</Text>}
            </Text>

            <TextInput
              value={typeof value === "string" ? value : value ? String(value) : ""}
              onChangeText={(text) => onChange(fullName, text)}
              placeholder={field.placeholder}
              placeholderTextColor={C.mutedText}
              multiline={field.type === "textarea"}
              numberOfLines={field.type === "textarea" ? 4 : 1}
              style={[
                {
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor: error ? C.logout : C.border,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: C.inkText,
                  fontSize: 14,
                  fontFamily: F?.sans,
                },
                field.type === "textarea"
                  ? ({ minHeight: 96, outline: "none", textAlignVertical: "top" } as any)
                  : ({ outline: "none" } as any),
              ]}
            />

            {!!error && (
              <Text style={{ fontSize: 12, color: C.logout, marginTop: 6 }}>{error}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default DynamicProfileForm;