export const PROFILE_FORM_CONFIG = [
  {
    name: "username",
    label: "Display Name",
    type: "text",
    required: true,
    min: 3,
    max: 30,
    placeholder: "Enter your display name",
  },
  {
    name: "bio",
    label: "About Me",
    type: "textarea",
    required: false,
    min: 0,
    max: 200,
    placeholder: "Write something about yourself...",
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { label: "Guest", value: "guest" },
      { label: "User", value: "user" },
      { label: "Editor", value: "editor" },
      { label: "Manager", value: "manager" },
      { label: "Admin", value: "admin" },
    ],
    defaultValue: "user",
  },
  {
    name: "adminCode",
    label: "Admin Code",
    type: "text",
    required: true,
    min: 5,
    max: 50,
    placeholder: "Required only when role is admin",
    showWhen: {
      field: "role",
      equals: "admin",
    },
  },
  {
    name: "preferences",
    label: "Preferences",
    type: "group",
    fields: [
      {
        name: "showSocialLinks",
        label: "Show Social Links",
        type: "switch",
        defaultValue: false,
      },
    ],
  },
  {
    name: "socialLinks",
    label: "Social Links",
    type: "group",
    showWhen: {
      field: "preferences.showSocialLinks",
      equals: true,
    },
    fields: [
      {
        name: "facebook",
        label: "Facebook",
        type: "text",
        placeholder: "facebook username or url",
      },
      {
        name: "instagram",
        label: "Instagram",
        type: "text",
        placeholder: "instagram username or url",
      },
      {
        name: "github",
        label: "GitHub",
        type: "text",
        placeholder: "github username or url",
      },
    ],
  },
];