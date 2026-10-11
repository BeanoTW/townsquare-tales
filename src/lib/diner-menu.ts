import { dinerMealAction, HOT_MEAL } from "@/lib/actions";
/** Shared by the counter screen and walkable diner; prices/rewards remain action-owned. */
export const DINER_MEALS = [
  {
    icon: "🥣",
    title: "Soup & bread",
    description: "Something warm and filling.",
    action: dinerMealAction("soup"),
  },
  { icon: "🍳", title: "Fryday special", description: "Our famous hot plate.", action: HOT_MEAL },
  {
    icon: "🥓",
    title: "Big breakfast",
    description: "The full works.",
    action: dinerMealAction("breakfast"),
  },
];
