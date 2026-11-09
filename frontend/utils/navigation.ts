import { useRouter } from "expo-router";
import { FoodRecord } from "./nutrition";

export const openSavedMeal = (router: ReturnType<typeof useRouter>, record: FoodRecord) =>
  router.push({
    pathname: "/edit-meal",
    params: { data: JSON.stringify(record), recordId: record._id },
  });
