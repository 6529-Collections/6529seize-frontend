"use client";

import { createContext, useContext } from "react";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";

export const CompetitionNavigationContext = createContext<{
  readonly flat: boolean;
  readonly nativeCompetition: ApiCompetition | null;
}>({ flat: false, nativeCompetition: null });

export const useCompetitionNavigation = () =>
  useContext(CompetitionNavigationContext);
